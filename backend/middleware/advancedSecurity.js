import crypto from 'crypto'
import logger from '../config/logger.js'
import { cache } from '../config/redis.js'

// Advanced security middleware
export class AdvancedSecurityMiddleware {
  constructor() {
    this.sessionStore = new Map()
    this.csrfTokens = new Map()
    this.bruteForceAttempts = new Map()
    this.suspiciousIPs = new Set()
    this.whitelistedIPs = new Set()
    this.blacklistedIPs = new Set()
  }

  // CSRF protection
  generateCSRFToken(req, res, next) {
    const token = crypto.randomBytes(32).toString('hex')
    const sessionId = req.sessionID || req.ip
    
    this.csrfTokens.set(sessionId, token)
    
    // Set CSRF token in cookie and header
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    })
    
    res.setHeader('X-CSRF-Token', token)
    
    req.csrfToken = token
    next()
  }

  // CSRF validation
  validateCSRFToken(req, res, next) {
    const token = req.get('X-CSRF-Token') || req.body._csrf
    const sessionId = req.sessionID || req.ip
    const storedToken = this.csrfTokens.get(sessionId)
    
    if (!token || !storedToken || token !== storedToken) {
      logger.security('CSRF token validation failed', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      })
      
      return res.status(403).json({
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID'
      })
    }
    
    next()
  }

  // IP-based security
  checkIPSecurity(req, res, next) {
    const ip = req.ip
    
    // Check if IP is blacklisted
    if (this.blacklistedIPs.has(ip)) {
      logger.security('Blacklisted IP access attempt', {
        ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      })
      
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_BLACKLISTED'
      })
    }
    
    // Check if IP is suspicious
    if (this.suspiciousIPs.has(ip)) {
      logger.security('Suspicious IP access attempt', {
        ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      })
      
      // Apply additional security measures for suspicious IPs
      req.suspiciousIP = true
    }
    
    next()
  }

  // Advanced request validation
  validateRequest(req, res, next) {
    const suspiciousPatterns = [
      /\.\./g, // Path traversal
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
      /union.*select/gi, // SQL injection
      /javascript:/gi, // JavaScript protocol
      /data:.*base64/gi, // Base64 data URI
      /eval\(/gi, // Eval function
      /exec\(/gi, // Exec function
      /system\(/gi // System function
    ]

    const checkSuspiciousContent = (data, path = '') => {
      if (typeof data === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(data))
      }
      if (typeof data === 'object' && data !== null) {
        return Object.entries(data).some(([key, value]) => {
          return checkSuspiciousContent(value, path ? `${path}.${key}` : key)
        })
      }
      return false
    }

    const requestData = {
      body: req.body,
      query: req.query,
      params: req.params
    }

    if (checkSuspiciousContent(requestData)) {
      logger.security('Suspicious request content detected', {
        ip: req.ip,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        suspiciousData: requestData,
        userId: req.user?.id
      })
      
      // Mark IP as suspicious
      this.suspiciousIPs.add(req.ip)
      
      return res.status(400).json({
        error: 'Invalid request content',
        code: 'SUSPICIOUS_CONTENT'
      })
    }

    next()
  }

  // Session security
  secureSession(req, res, next) {
    const sessionId = req.sessionID || req.ip
    
    // Check session validity
    if (this.sessionStore.has(sessionId)) {
      const session = this.sessionStore.get(sessionId)
      
      // Check if session has expired
      if (Date.now() - session.lastActivity > 3600000) { // 1 hour
        this.sessionStore.delete(sessionId)
        
        logger.security('Session expired', {
          sessionId,
          ip: req.ip,
          userId: req.user?.id
        })
        
        return res.status(401).json({
          error: 'Session expired',
          code: 'SESSION_EXPIRED'
        })
      }
      
      // Update last activity
      session.lastActivity = Date.now()
      
      // Check for session hijacking
      if (session.ip !== req.ip) {
        logger.security('Session hijacking attempt detected', {
          sessionId,
          originalIP: session.ip,
          currentIP: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id
        })
        
        this.sessionStore.delete(sessionId)
        
        return res.status(401).json({
          error: 'Session invalid',
          code: 'SESSION_HIJACKED'
        })
      }
    }

    next()
  }

  // Advanced brute force protection
  protectBruteForce(req, res, next) {
    const ip = req.ip
    const key = `brute_force:${ip}`
    
    // Get current attempts
    const attempts = this.bruteForceAttempts.get(key) || { count: 0, lastAttempt: 0, lockedUntil: 0 }
    
    // Check if IP is locked
    if (attempts.lockedUntil > Date.now()) {
      const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000)
      
      logger.security('Brute force protection - IP locked', {
        ip,
        attempts: attempts.count,
        lockedUntil: new Date(attempts.lockedUntil),
        remainingTime,
        url: req.url,
        method: req.method
      })
      
      return res.status(429).json({
        error: 'Too many failed attempts',
        code: 'BRUTE_FORCE_LOCKED',
        retryAfter: remainingTime
      })
    }
    
    // Monitor failed attempts
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        attempts.count++
        attempts.lastAttempt = Date.now()
        
        // Apply progressive lockout
        if (attempts.count >= 5) {
          attempts.lockedUntil = Date.now() + (Math.pow(2, attempts.count - 4) * 60000) // Exponential backoff
          
          logger.security('Brute force protection - IP locked', {
            ip,
            attempts: attempts.count,
            lockedUntil: new Date(attempts.lockedUntil)
          })
        }
        
        this.bruteForceAttempts.set(key, attempts)
      } else if (res.statusCode < 400) {
        // Reset on successful request
        this.bruteForceAttempts.delete(key)
      }
    })

    next()
  }

  // Content Security Policy
  setCSP(req, res, next) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "media-src 'self'",
      "manifest-src 'self'"
    ].join('; ')

    res.setHeader('Content-Security-Policy', csp)
    next()
  }

  // Security headers
  setSecurityHeaders(req, res, next) {
    // HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY')
    
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 
      'geolocation=(), ' +
      'microphone=(), ' +
      'camera=(), ' +
      'payment=(), ' +
      'usb=()'
    )
    
    next()
  }

  // API key validation
  validateAPIKey(req, res, next) {
    const apiKey = req.get('X-API-Key')
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_MISSING'
      })
    }
    
    // Validate API key format
    if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
      logger.security('Invalid API key format', {
        ip: req.ip,
        apiKey: apiKey.substring(0, 8) + '...',
        url: req.url,
        method: req.method
      })
      
      return res.status(401).json({
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      })
    }
    
    // Check API key against database or cache
    // This would integrate with your API key management system
    req.apiKey = apiKey
    next()
  }

  // Request size limiting
  limitRequestSize(req, res, next) {
    const contentLength = req.get('content-length')
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.security('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize,
        url: req.url,
        method: req.method
      })
      
      return res.status(413).json({
        error: 'Request too large',
        code: 'REQUEST_TOO_LARGE'
      })
    }
    
    next()
  }

  // IP reputation checking
  async checkIPReputation(req, res, next) {
    const ip = req.ip
    
    try {
      // Check against known malicious IP databases
      // This would integrate with services like VirusTotal, AbuseIPDB, etc.
      const reputation = await this.getIPReputation(ip)
      
      if (reputation.malicious) {
        logger.security('Malicious IP detected', {
          ip,
          reputation,
          url: req.url,
          method: req.method
        })
        
        this.blacklistedIPs.add(ip)
        
        return res.status(403).json({
          error: 'Access denied',
          code: 'IP_MALICIOUS'
        })
      }
      
      if (reputation.suspicious) {
        this.suspiciousIPs.add(ip)
        req.suspiciousIP = true
      }
      
    } catch (error) {
      logger.error('IP reputation check failed', { error: error.message, ip })
    }
    
    next()
  }

  // Helper method to get IP reputation (placeholder)
  async getIPReputation(ip) {
    // This would integrate with real IP reputation services
    // For now, return a default response
    return {
      malicious: false,
      suspicious: false,
      reputation: 'unknown'
    }
  }

  // Security analytics
  getSecurityStats() {
    return {
      suspiciousIPs: this.suspiciousIPs.size,
      blacklistedIPs: this.blacklistedIPs.size,
      whitelistedIPs: this.whitelistedIPs.size,
      activeSessions: this.sessionStore.size,
      csrfTokens: this.csrfTokens.size,
      bruteForceAttempts: this.bruteForceAttempts.size
    }
  }

  // Cleanup expired data
  cleanup() {
    const now = Date.now()
    
    // Clean up expired sessions
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (now - session.lastActivity > 3600000) { // 1 hour
        this.sessionStore.delete(sessionId)
      }
    }
    
    // Clean up expired CSRF tokens
    for (const [sessionId, token] of this.csrfTokens.entries()) {
      // CSRF tokens expire after 1 hour
      // This is a simplified cleanup - in production, you'd store creation time
      this.csrfTokens.delete(sessionId)
    }
    
    // Clean up old brute force attempts
    for (const [key, attempts] of this.bruteForceAttempts.entries()) {
      if (now - attempts.lastAttempt > 86400000) { // 24 hours
        this.bruteForceAttempts.delete(key)
      }
    }
  }
}

// Create singleton instance
const advancedSecurity = new AdvancedSecurityMiddleware()

// Export middleware functions
export const {
  generateCSRFToken,
  validateCSRFToken,
  checkIPSecurity,
  validateRequest,
  secureSession,
  protectBruteForce,
  setCSP,
  setSecurityHeaders,
  validateAPIKey,
  limitRequestSize,
  checkIPReputation,
  getSecurityStats,
  cleanup
} = advancedSecurity

// Auto-cleanup every hour
setInterval(() => {
  advancedSecurity.cleanup()
}, 3600000)

export default advancedSecurity
