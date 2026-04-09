import logger from '../config/logger.js'
import { performance } from 'perf_hooks'

// Request monitoring middleware
export const requestMonitor = (req, res, next) => {
  const startTime = performance.now()
  const requestId = Math.random().toString(36).substring(7)
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId)
  
  // Log request start
  logger.api('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  })
  
  // Override res.json to log response
  const originalJson = res.json
  res.json = function(data) {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    logger.api('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      responseSize: JSON.stringify(data).length
    })
    
    return originalJson.call(this, data)
  }
  
  // Handle response finish
  res.on('finish', () => {
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)
    
    if (res.statusCode >= 400) {
      logger.api('Request completed with error', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id
      })
    }
  })
  
  next()
}

// Performance monitoring middleware
export const performanceMonitor = (req, res, next) => {
  const startTime = performance.now()
  
  res.on('finish', () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.performance('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${Math.round(duration)}ms`,
        statusCode: res.statusCode,
        userId: req.user?.id
      })
    }
    
    // Log database queries if available
    if (req.dbQueryCount) {
      logger.performance('Database query count', {
        method: req.method,
        url: req.url,
        queryCount: req.dbQueryCount,
        userId: req.user?.id
      })
    }
  })
  
  next()
}

// Error monitoring middleware
export const errorMonitor = (err, req, res, next) => {
  const requestId = req.headers['x-request-id'] || 'unknown'
  
  logger.error('Unhandled error occurred', {
    requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })
  
  next(err)
}

// Database query monitoring
export const databaseMonitor = (pool) => {
  const originalQuery = pool.query
  
  pool.query = async function(...args) {
    const startTime = performance.now()
    
    try {
      const result = await originalQuery.apply(this, args)
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        logger.database('Slow database query detected', {
          query: args[0],
          duration: `${duration}ms`,
          params: args[1] ? 'present' : 'none'
        })
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)
      
      logger.database('Database query failed', {
        query: args[0],
        duration: `${duration}ms`,
        params: args[1] ? 'present' : 'none',
        error: error.message
      })
      
      throw error
    }
  }
  
  return pool
}

// Health check metrics
export const healthMetrics = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  slowRequestCount: 0,
  
  incrementRequestCount: () => {
    healthMetrics.requestCount++
  },
  
  incrementErrorCount: () => {
    healthMetrics.errorCount++
  },
  
  incrementSlowRequestCount: () => {
    healthMetrics.slowRequestCount++
  },
  
  getMetrics: () => ({
    uptime: Date.now() - healthMetrics.startTime,
    requestCount: healthMetrics.requestCount,
    errorCount: healthMetrics.errorCount,
    slowRequestCount: healthMetrics.slowRequestCount,
    errorRate: healthMetrics.requestCount > 0 
      ? (healthMetrics.errorCount / healthMetrics.requestCount * 100).toFixed(2) + '%'
      : '0%',
    slowRequestRate: healthMetrics.requestCount > 0
      ? (healthMetrics.slowRequestCount / healthMetrics.requestCount * 100).toFixed(2) + '%'
      : '0%'
  })
}
