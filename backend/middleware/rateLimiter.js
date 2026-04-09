import rateLimit from 'express-rate-limit'
import logger from '../config/logger.js'

// General rate limiter for all requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.id
    })
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    })
  }
})

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.security('Authentication rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : req.body
    })
    
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    })
  }
})

// Rate limiter for password changes
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password changes per hour
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many password change attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.security('Password change rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url
    })
    
    res.status(429).json({
      error: 'Too many password change attempts, please try again later.',
      retryAfter: '1 hour'
    })
  }
})

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.'
  },
  handler: (req, res) => {
    logger.security('Upload rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url
    })
    
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      retryAfter: '1 hour'
    })
  }
})

// Rate limiter for API endpoints that create resources
export const createResourceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 resource creations per hour
  message: {
    error: 'Too many resource creation attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.security('Resource creation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url,
      method: req.method,
      body: req.body
    })
    
    res.status(429).json({
      error: 'Too many resource creation attempts, please try again later.',
      retryAfter: '1 hour'
    })
  }
})

// Rate limiter for report generation
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 report generations per hour
  message: {
    error: 'Too many report generation attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.security('Report generation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      url: req.url
    })
    
    res.status(429).json({
      error: 'Too many report generation attempts, please try again later.',
      retryAfter: '1 hour'
    })
  }
})
