import logger from '../config/logger.js'
import { cache } from '../config/redis.js'

// Cache middleware factory
export const cacheMiddleware = (options = {}) => {
  const {
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    ttl = 300, // 5 minutes default
    condition = () => true,
    invalidateOn = [], // Array of HTTP methods that should invalidate cache
    skipCache = false
  } = options

  return async (req, res, next) => {
    // Skip caching if disabled or condition not met
    if (skipCache || !condition(req)) {
      return next()
    }

    const cacheKey = keyGenerator(req)
    
    // Check if we should invalidate cache for this request
    if (invalidateOn.includes(req.method)) {
      await cache.invalidatePattern(cacheKey.split(':')[0])
      return next()
    }

    // Try to get from cache
    const cachedData = await cache.get(cacheKey)
    if (cachedData) {
      logger.database('Cache middleware hit', { key: cacheKey, method: req.method })
      return res.json(cachedData)
    }

    // Override res.json to cache the response
    const originalJson = res.json
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl).catch(err => {
          logger.error('Failed to cache response', { key: cacheKey, error: err.message })
        })
      }
      return originalJson.call(this, data)
    }

    next()
  }
}

// Specific cache middleware for common patterns
export const cacheUser = (ttl = 3600) => cacheMiddleware({
  keyGenerator: (req) => `user:${req.user?.id || 'anonymous'}`,
  ttl,
  condition: (req) => req.user && req.user.id,
  invalidateOn: ['PUT', 'DELETE']
})

export const cacheStudents = (ttl = 1800) => cacheMiddleware({
  keyGenerator: (req) => `students:${JSON.stringify(req.query)}`,
  ttl,
  condition: (req) => req.method === 'GET',
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

export const cacheTeachers = (ttl = 1800) => cacheMiddleware({
  keyGenerator: (req) => `teachers:${JSON.stringify(req.query)}`,
  ttl,
  condition: (req) => req.method === 'GET',
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

export const cacheClasses = (ttl = 1800) => cacheMiddleware({
  keyGenerator: (req) => `classes:${JSON.stringify(req.query)}`,
  ttl,
  condition: (req) => req.method === 'GET',
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

export const cacheSubjects = (ttl = 3600) => cacheMiddleware({
  keyGenerator: (req) => 'subjects:all',
  ttl,
  condition: (req) => req.method === 'GET' && !req.params.id,
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

export const cacheAcademicYears = (ttl = 7200) => cacheMiddleware({
  keyGenerator: (req) => 'academic_years:all',
  ttl,
  condition: (req) => req.method === 'GET',
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

export const cacheReports = (ttl = 1800) => cacheMiddleware({
  keyGenerator: (req) => `report:${req.originalUrl}:${JSON.stringify(req.query)}`,
  ttl,
  condition: (req) => req.method === 'GET',
  invalidateOn: ['POST', 'PUT', 'DELETE']
})

// Cache invalidation helper
export const invalidateCache = async (patterns) => {
  const invalidationPromises = patterns.map(pattern => {
    if (typeof pattern === 'string') {
      return cache.invalidatePattern(pattern)
    } else if (typeof pattern === 'function') {
      return pattern(req).then(key => cache.del(key))
    }
  })

  try {
    await Promise.allSettled(invalidationPromises)
    logger.database('Cache invalidation completed', { patterns })
  } catch (error) {
    logger.error('Cache invalidation failed', { error: error.message })
  }
}

// Cache warming function
export const warmCache = async () => {
  try {
    // This would typically be called on startup or by a background job
    logger.info('Starting cache warming')
    
    // Example: Warm commonly accessed data
    // await cache.setAcademicYears(await getAcademicYears(), 7200)
    // await cache.setSubjects(await getSubjects(), 3600)
    
    logger.info('Cache warming completed')
  } catch (error) {
    logger.error('Cache warming failed', { error: error.message })
  }
}

// Cache statistics middleware
export const cacheStats = async (req, res, next) => {
  try {
    const redisInfo = await redisClient.getInfo()
    req.cacheStats = redisInfo
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message })
    req.cacheStats = { connected: false }
  }
  
  next()
}
