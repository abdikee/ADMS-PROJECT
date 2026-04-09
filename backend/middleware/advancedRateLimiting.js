import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redisClient from '../config/redis.js'
import logger from '../config/logger.js'

// Advanced rate limiting with Redis backend
class AdvancedRateLimiter {
  constructor() {
    this.store = new RedisStore({
      sendCommand: (...args) => redisClient.client.sendCommand(args),
      prefix: 'rl:'
    })
  }

  // Adaptive rate limiting based on user behavior
  createAdaptiveLimiter(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = (req) => req.ip,
      onLimitReached = (req, res, options) => {
        logger.security('Rate limit reached', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          limit: options.max,
          windowMs: options.windowMs,
          userId: req.user?.id
        })
      }
    } = options

    return rateLimit({
      store: this.store,
      windowMs,
      max: maxRequests,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      skipFailedRequests,
      keyGenerator,
      onLimitReached
    })
  }

  // Dynamic rate limiting based on user tier
  createTieredLimiter() {
    return async (req, res, next) => {
      let maxRequests = 100 // Default tier
      let windowMs = 15 * 60 * 1000 // 15 minutes

      // Adjust limits based on user role
      if (req.user) {
        switch (req.user.role) {
          case 'admin':
            maxRequests = 1000
            windowMs = 15 * 60 * 1000
            break
          case 'teacher':
            maxRequests = 500
            windowMs = 15 * 60 * 1000
            break
          case 'student':
            maxRequests = 200
            windowMs = 15 * 60 * 1000
            break
        }
      }

      // Apply dynamic rate limiting
      const limiter = rateLimit({
        store: this.store,
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => req.user ? `user:${req.user.id}` : req.ip,
        message: {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 1000),
          tier: req.user?.role || 'anonymous'
        }
      })

      return limiter(req, res, next)
    }
  }

  // Burst rate limiting for short-term protection
  createBurstLimiter() {
    return rateLimit({
      store: this.store,
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute
      keyGenerator: (req) => req.ip,
      message: {
        error: 'Too many requests in short time',
        retryAfter: 60
      }
    })
  }

  // Sustained rate limiting for long-term protection
  createSustainedLimiter() {
    return rateLimit({
      store: this.store,
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 requests per hour
      keyGenerator: (req) => req.ip,
      message: {
        error: 'Hourly rate limit exceeded',
        retryAfter: 3600
      }
    })
  }

  // API endpoint specific rate limiting
  createEndpointLimiter(config = {}) {
    const {
      endpoint = '*',
      windowMs = 15 * 60 * 1000,
      maxRequests = 100,
      method = 'GET'
    } = config

    return rateLimit({
      store: this.store,
      windowMs,
      max: maxRequests,
      keyGenerator: (req) => `${req.method}:${req.ip}:${endpoint}`,
      skip: (req) => config.endpoint !== '*' && !req.path.includes(config.endpoint),
      message: {
        error: `Rate limit exceeded for ${method} ${endpoint}`,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    })
  }

  // Intelligent rate limiting based on request patterns
  createIntelligentLimiter() {
    const requestPatterns = new Map()
    const suspiciousIPs = new Set()

    return async (req, res, next) => {
      const ip = req.ip
      const endpoint = req.path
      const method = req.method

      // Track request patterns
      const patternKey = `${ip}:${endpoint}`
      const now = Date.now()

      if (!requestPatterns.has(patternKey)) {
        requestPatterns.set(patternKey, {
          count: 0,
          firstRequest: now,
          lastRequest: now
        })
      }

      const pattern = requestPatterns.get(patternKey)
      pattern.count++
      pattern.lastRequest = now

      // Detect suspicious patterns
      const timeDiff = pattern.lastRequest - pattern.firstRequest
      const requestRate = pattern.count / (timeDiff / 1000) // requests per second

      if (requestRate > 10) { // More than 10 requests per second
        suspiciousIPs.add(ip)
        logger.security('Suspicious request pattern detected', {
          ip,
          endpoint,
          method,
          requestRate,
          totalRequests: pattern.count
        })
      }

      // Apply stricter limits for suspicious IPs
      let maxRequests = 100
      let windowMs = 15 * 60 * 1000

      if (suspiciousIPs.has(ip)) {
        maxRequests = 10
        windowMs = 5 * 60 * 1000 // 5 minutes
      }

      const limiter = rateLimit({
        store: this.store,
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => ip,
        message: {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 1000),
          suspicious: suspiciousIPs.has(ip)
        }
      })

      return limiter(req, res, next)
    }
  }

  // Rate limiting with progressive penalties
  createProgressiveLimiter() {
    return async (req, res, next) => {
      const ip = req.ip
      const penaltyKey = `penalty:${ip}`

      try {
        // Get current penalty level
        const penaltyLevel = await redisClient.get(penaltyKey) || 0
        const penaltyLevelNum = parseInt(penaltyLevel)

        let maxRequests = 100
        let windowMs = 15 * 60 * 1000

        // Apply progressive penalties
        if (penaltyLevelNum > 0) {
          maxRequests = Math.max(10, 100 / (penaltyLevelNum + 1))
          windowMs = 15 * 60 * 1000 * (penaltyLevelNum + 1)
        }

        const limiter = rateLimit({
          store: this.store,
          windowMs,
          max: maxRequests,
          keyGenerator: (req) => ip,
          onLimitReached: async (req, res, options) => {
            // Increase penalty level
            const newPenaltyLevel = penaltyLevelNum + 1
            await redisClient.set(penaltyKey, newPenaltyLevel, { ttl: 3600 }) // 1 hour

            logger.security('Progressive penalty applied', {
              ip,
              penaltyLevel: newPenaltyLevel,
              maxRequests,
              windowMs
            })
          }
        })

        return limiter(req, res, next)
      } catch (error) {
        logger.error('Progressive rate limiter error', { error: error.message })
        next()
      }
    }
  }

  // Rate limiting with whitelist support
  createWhitelistLimiter(whitelistedIPs = []) {
    return rateLimit({
      store: this.store,
      windowMs: 15 * 60 * 1000,
      max: 100,
      skip: (req) => {
        const ip = req.ip
        return whitelistedIPs.includes(ip)
      },
      keyGenerator: (req) => req.ip,
      message: {
        error: 'Rate limit exceeded',
        retryAfter: 900
      }
    })
  }

  // Rate limiting with geolocation-based rules
  createGeolocationLimiter() {
    return async (req, res, next) => {
      const ip = req.ip
      
      try {
        // Get country from IP (you would integrate with a geolocation service)
        const country = await this.getCountryFromIP(ip)
        
        let maxRequests = 100
        let windowMs = 15 * 60 * 1000

        // Apply different limits based on country
        switch (country) {
          case 'US':
          case 'CA':
          case 'GB':
            maxRequests = 200
            break
          case 'CN':
          case 'RU':
            maxRequests = 50
            break
          default:
            maxRequests = 100
        }

        const limiter = rateLimit({
          store: this.store,
          windowMs,
          max: maxRequests,
          keyGenerator: (req) => `${req.ip}:${country}`,
          message: {
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil(windowMs / 1000),
            country
          }
        })

        return limiter(req, res, next)
      } catch (error) {
        logger.error('Geolocation rate limiter error', { error: error.message })
        next()
      }
    }
  }

  // Helper method to get country from IP (placeholder implementation)
  async getCountryFromIP(ip) {
    // This would integrate with a real geolocation service
    // For now, return a default
    return 'US'
  }

  // Rate limiting analytics
  async getRateLimitStats() {
    try {
      const keys = await redisClient.client.keys('rl:*')
      const stats = {}

      for (const key of keys) {
        const value = await redisClient.get(key)
        if (value) {
          const parts = key.split(':')
          const type = parts[1] || 'unknown'
          const identifier = parts.slice(2).join(':')

          if (!stats[type]) {
            stats[type] = {}
          }

          stats[type][identifier] = parseInt(value)
        }
      }

      return stats
    } catch (error) {
      logger.error('Failed to get rate limit stats', { error: error.message })
      return {}
    }
  }

  // Reset rate limits for a specific IP
  async resetRateLimit(ip) {
    try {
      const keys = await redisClient.client.keys(`rl:*${ip}*`)
      
      for (const key of keys) {
        await redisClient.del(key)
      }

      logger.info('Rate limit reset', { ip })
    } catch (error) {
      logger.error('Failed to reset rate limit', { error: error.message, ip })
    }
  }
}

// Create singleton instance
const advancedRateLimiter = new AdvancedRateLimiter()

// Export pre-configured limiters
export const {
  createAdaptiveLimiter,
  createTieredLimiter,
  createBurstLimiter,
  createSustainedLimiter,
  createEndpointLimiter,
  createIntelligentLimiter,
  createProgressiveLimiter,
  createWhitelistLimiter,
  createGeolocationLimiter,
  getRateLimitStats,
  resetRateLimit
} = advancedRateLimiter

// Common rate limiters
export const adaptiveLimiter = advancedRateLimiter.createAdaptiveLimiter()
export const tieredLimiter = advancedRateLimiter.createTieredLimiter()
export const burstLimiter = advancedRateLimiter.createBurstLimiter()
export const sustainedLimiter = advancedRateLimiter.createSustainedLimiter()
export const intelligentLimiter = advancedRateLimiter.createIntelligentLimiter()
export const progressiveLimiter = advancedRateLimiter.createProgressiveLimiter()

export default advancedRateLimiter
