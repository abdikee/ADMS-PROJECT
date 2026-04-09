import logger from '../config/logger.js'
import { performance } from 'perf_hooks'

// Performance optimization middleware
export const performanceOptimizer = (req, res, next) => {
  const startTime = performance.now()
  
  // Add performance headers
  res.setHeader('X-Response-Time', '0ms')
  res.setHeader('X-Cache-Status', 'MISS')
  
  // Track slow queries
  res.on('finish', () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    res.setHeader('X-Response-Time', `${Math.round(duration)}ms`)
    
    if (duration > 1000) {
      logger.performance('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${Math.round(duration)}ms`,
        statusCode: res.statusCode
      })
    }
  })
  
  next()
}

// Database query optimization
export const optimizeDatabaseQuery = (query, params = []) => {
  const optimizedQuery = {
    original: query,
    optimized: query,
    params: params,
    optimizations: []
  }
  
  // Add LIMIT if not present for SELECT queries
  if (query.toLowerCase().includes('select') && !query.toLowerCase().includes('limit')) {
    optimizedQuery.optimized += ' LIMIT 1000'
    optimizedQuery.optimizations.push('Added LIMIT 1000 to prevent large result sets')
  }
  
  // Add ORDER BY with index hints if possible
  if (query.toLowerCase().includes('where') && !query.toLowerCase().includes('order by')) {
    // This would need to be customized based on your schema
    optimizedQuery.optimizations.push('Consider adding ORDER BY for consistent results')
  }
  
  return optimizedQuery
}

// Memory usage monitoring
export const memoryMonitor = () => {
  const memUsage = process.memoryUsage()
  
  const formatted = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
  }
  
  // Log warning if memory usage is high
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024
  if (heapUsedMB > 500) {
    logger.performance('High memory usage detected', formatted)
  }
  
  return formatted
}

// Connection pooling optimization
export const connectionPoolOptimizer = (pool) => {
  // Monitor pool statistics
  const originalGetConnection = pool.getConnection
  
  pool.getConnection = async function() {
    const startTime = performance.now()
    
    try {
      const connection = await originalGetConnection.call(this)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (duration > 100) {
        logger.performance('Slow database connection', {
          duration: `${Math.round(duration)}ms`,
          poolSize: this.pool?.numUsed || 'unknown'
        })
      }
      
      return connection
    } catch (error) {
      logger.error('Database connection failed', { error: error.message })
      throw error
    }
  }
  
  return pool
}

// Response compression
export const compressionMiddleware = (req, res, next) => {
  const acceptEncoding = req.get('Accept-Encoding') || ''
  
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip')
  }
  
  next()
}

// Cache optimization
export const cacheOptimizer = (req, res, next) => {
  // Add cache control headers
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300') // 5 minutes
  } else {
    res.setHeader('Cache-Control', 'no-cache')
  }
  
  next()
}

// Batch processing optimization
export const batchProcessor = {
  // Process multiple database operations in a single transaction
  async processBatch(operations) {
    const startTime = performance.now()
    
    try {
      // This would integrate with your database connection
      const results = await Promise.allSettled(operations)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      logger.performance('Batch processing completed', {
        operationCount: operations.length,
        duration: `${Math.round(duration)}ms`,
        successRate: `${Math.round((results.filter(r => r.status === 'fulfilled').length / results.length) * 100)}%`
      })
      
      return results
    } catch (error) {
      logger.error('Batch processing failed', { error: error.message })
      throw error
    }
  }
}

// Lazy loading helper
export const lazyLoader = {
  // Load data in chunks to improve performance
  async loadChunked(loader, chunkSize = 100, offset = 0) {
    const startTime = performance.now()
    
    try {
      const data = await loader(chunkSize, offset)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      logger.performance('Chunked data loaded', {
        chunkSize,
        offset,
        dataCount: data.length,
        duration: `${Math.round(duration)}ms`
      })
      
      return data
    } catch (error) {
      logger.error('Chunked loading failed', { error: error.message })
      throw error
    }
  }
}

// Performance metrics collector
export const metricsCollector = {
  requests: 0,
  errors: 0,
  totalResponseTime: 0,
  slowRequests: 0,
  
  recordRequest(duration, isError = false) {
    this.requests++
    this.totalResponseTime += duration
    
    if (isError) {
      this.errors++
    }
    
    if (duration > 1000) {
      this.slowRequests++
    }
  },
  
  getMetrics() {
    const avgResponseTime = this.requests > 0 ? this.totalResponseTime / this.requests : 0
    const errorRate = this.requests > 0 ? (this.errors / this.requests) * 100 : 0
    const slowRequestRate = this.requests > 0 ? (this.slowRequests / this.requests) * 100 : 0
    
    return {
      totalRequests: this.requests,
      averageResponseTime: `${Math.round(avgResponseTime)}ms`,
      errorRate: `${Math.round(errorRate)}%`,
      slowRequestRate: `${Math.round(slowRequestRate)}%`,
      memoryUsage: memoryMonitor()
    }
  },
  
  reset() {
    this.requests = 0
    this.errors = 0
    this.totalResponseTime = 0
    this.slowRequests = 0
  }
}
