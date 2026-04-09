import logger from '../config/logger.js'
import { env } from '../config/env.js'

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', {
      originalError: originalError?.message,
      stack: originalError?.stack
    })
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const response = {
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    requestId: req.headers['x-request-id'] || 'unknown'
  }

  // Add error code if available
  if (error.code) {
    response.code = error.code
  }

  // Add error details if available and in development
  if (error.details && env.NODE_ENV === 'development') {
    response.details = error.details
  }

  // Add stack trace in development
  if (error.stack && env.NODE_ENV === 'development') {
    response.stack = error.stack
  }

  return response
}

// Database error handler
const handleDatabaseError = (error, req) => {
  logger.error('Database error occurred', {
    error: error.message,
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    query: error.query,
    parameters: error.parameters,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  })

  // Map common PostgreSQL errors to HTTP status codes
  switch (error.code) {
    case '23505': // Unique violation
      return new ConflictError('Resource already exists')
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist')
    case '23502': // Not null violation
      return new ValidationError('Required field is missing')
    case '23514': // Check violation
      return new ValidationError('Data validation failed')
    case '42P01': // Undefined table
      return new DatabaseError('Database schema error', error)
    case '42703': // Undefined column
      return new DatabaseError('Database schema error', error)
    case '08006': // Connection failure
      return new DatabaseError('Database connection failed', error)
    case '08001': // SQL client unable to establish SQL connection
      return new DatabaseError('Cannot connect to database', error)
    case '57014': // Statement timeout
      return new DatabaseError('Query timeout', error)
    case '53300': // Too many connections
      return new DatabaseError('Database overloaded', error)
    default:
      return new DatabaseError('Database operation failed', error)
  }
}

// JWT error handler
const handleJWTError = (error, req) => {
  logger.security('JWT error occurred', {
    error: error.message,
    name: error.name,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token')
  }
  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired')
  }
  if (error.name === 'NotBeforeError') {
    return new UnauthorizedError('Token not active')
  }
  return new UnauthorizedError('Authentication failed')
}

// Validation error handler
const handleValidationError = (error, req) => {
  logger.security('Validation error occurred', {
    error: error.message,
    details: error.details,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  })

  if (error.details && Array.isArray(error.details)) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path?.join('.') || 'unknown',
      message: detail.message,
      value: detail.context?.value
    }))

    return new ValidationError('Validation failed', validationErrors)
  }

  return new ValidationError(error.message)
}

// Multer error handler (file uploads)
const handleMulterError = (error, req) => {
  logger.security('File upload error occurred', {
    error: error.message,
    code: error.code,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  })

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new ValidationError('File size too large')
    case 'LIMIT_FILE_COUNT':
      return new ValidationError('Too many files')
    case 'LIMIT_UNEXPECTED_FILE':
      return new ValidationError('Unexpected file field')
    default:
      return new ValidationError('File upload failed')
  }
}

// Rate limit error handler
const handleRateLimitError = (error, req) => {
  logger.security('Rate limit exceeded', {
    error: error.message,
    limit: error.limit,
    current: error.current,
    remaining: error.remaining,
    resetTime: error.resetTime,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  })

  return new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', {
    limit: error.limit,
    resetTime: error.resetTime
  })
}

// Main error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = err

  // Ensure error is an AppError instance
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name && error.name.startsWith('Sequelize')) {
      error = handleDatabaseError(error, req)
    } else if (error.name && error.name.includes('JsonWebToken')) {
      error = handleJWTError(error, req)
    } else if (error.name === 'ValidationError') {
      error = handleValidationError(error, req)
    } else if (error.name === 'MulterError') {
      error = handleMulterError(error, req)
    } else if (error.code === 'ECONNREFUSED') {
      error = new ExternalServiceError('Database', 'Connection refused')
    } else if (error.code === 'ETIMEDOUT') {
      error = new ExternalServiceError('Database', 'Connection timeout')
    } else {
      // Generic error
      logger.error('Unhandled error occurred', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id
      })

      error = new AppError(
        env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  // Log operational errors
  if (error.isOperational) {
    logger.warn('Operational error', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    })
  } else {
    logger.error('Programming error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    })
  }

  // Send error response
  const errorResponse = formatErrorResponse(error, req)
  res.status(error.statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req, res) => {
  const error = new NotFoundError('Route')
  const errorResponse = formatErrorResponse(error, req)
  res.status(404).json(errorResponse)
}

// Process error handlers
export const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    })
    
    // Perform graceful shutdown
    process.exit(1)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason.toString(),
      promise: promise.toString()
    })
    
    // Perform graceful shutdown
    process.exit(1)
  })

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn('Process Warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack
    })
  })

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    process.exit(0)
  })

  // Handle SIGINT
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully')
    process.exit(0)
  })
}

// Error recovery utilities
export const errorRecovery = {
  // Retry mechanism for database operations
  async retry(operation, maxRetries = 3, delay = 1000) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }
        
        logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
          error: error.message,
          attempt,
          maxRetries
        })
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
      }
    }
    
    throw lastError
  },

  // Circuit breaker pattern
  createCircuitBreaker(threshold = 5, timeout = 60000) {
    let failures = 0
    let lastFailureTime = 0
    let state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN

    return async (operation) => {
      const now = Date.now()
      
      if (state === 'OPEN') {
        if (now - lastFailureTime > timeout) {
          state = 'HALF_OPEN'
          logger.info('Circuit breaker transitioning to HALF_OPEN')
        } else {
          throw new ExternalServiceError('Circuit breaker', 'Service temporarily unavailable')
        }
      }

      try {
        const result = await operation()
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED'
          failures = 0
          logger.info('Circuit breaker transitioning to CLOSED')
        }
        
        return result
      } catch (error) {
        failures++
        lastFailureTime = now
        
        if (failures >= threshold) {
          state = 'OPEN'
          logger.error('Circuit breaker transitioning to OPEN', { failures, threshold })
        }
        
        throw error
      }
    }
  }
}
