import logger from '../config/logger.js'

// Validation middleware factory
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source]
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      })

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))

        logger.security('Validation failed', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          errors: validationErrors,
          userId: req.user?.id
        })

        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors
        })
      }

      // Replace the original data with validated data
      req[source] = value
      next()
    } catch (err) {
      logger.error('Validation middleware error', { error: err.message })
      res.status(500).json({ error: 'Internal validation error' })
    }
  }
}

// Input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/['"]/g, '') // Remove quotes
  }

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'string') return sanitizeString(obj)
    if (typeof obj === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value)
      }
      return sanitized
    }
    return obj
  }

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query)
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params)
  }

  next()
}

// SQL injection prevention
export const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/gi,
    /(\b(OR|AND)\s+TRUE|FALSE\b)/gi
  ]

  const checkForSQLInjection = (data) => {
    if (typeof data === 'string') {
      return sqlPatterns.some(pattern => pattern.test(data))
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => checkForSQLInjection(value))
    }
    return false
  }

  const suspiciousData = {
    body: checkForSQLInjection(req.body),
    query: checkForSQLInjection(req.query),
    params: checkForSQLInjection(req.params)
  }

  if (suspiciousData.body || suspiciousData.query || suspiciousData.params) {
    logger.security('SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      suspiciousData,
      userId: req.user?.id
    })

    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'SECURITY_VIOLATION'
    })
  }

  next()
}

// XSS prevention
export const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img\b[^>]*src\s*=\s*['"]*javascript:/gi,
    /<object\b[^>]*data\s*=\s*['"]*javascript:/gi
  ]

  const checkForXSS = (data) => {
    if (typeof data === 'string') {
      return xssPatterns.some(pattern => pattern.test(data))
    }
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => checkForXSS(value))
    }
    return false
  }

  const suspiciousData = {
    body: checkForXSS(req.body),
    query: checkForXSS(req.query),
    params: checkForXSS(req.params)
  }

  if (suspiciousData.body || suspiciousData.query || suspiciousData.params) {
    logger.security('XSS attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      suspiciousData,
      userId: req.user?.id
    })

    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'SECURITY_VIOLATION'
    })
  }

  next()
}

// File upload validation
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  } = options

  return (req, res, next) => {
    if (!req.file) {
      return next()
    }

    // Check file size
    if (req.file.size > maxSize) {
      logger.security('File size limit exceeded', {
        ip: req.ip,
        fileSize: req.file.size,
        maxSize,
        filename: req.file.originalname,
        userId: req.user?.id
      })

      return res.status(400).json({
        error: 'File size too large',
        maxSize: `${maxSize / 1024 / 1024}MB`
      })
    }

    // Check MIME type
    if (!allowedTypes.includes(req.file.mimetype)) {
      logger.security('Invalid file type detected', {
        ip: req.ip,
        mimeType: req.file.mimetype,
        filename: req.file.originalname,
        userId: req.user?.id
      })

      return res.status(400).json({
        error: 'Invalid file type',
        allowedTypes
      })
    }

    // Check file extension
    const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      logger.security('Invalid file extension detected', {
        ip: req.ip,
        extension: fileExtension,
        filename: req.file.originalname,
        userId: req.user?.id
      })

      return res.status(400).json({
        error: 'Invalid file extension',
        allowedExtensions
      })
    }

    next()
  }
}

// Rate limiting validation
export const validateRateLimit = (req, res, next) => {
  const userAgent = req.get('User-Agent')
  const ip = req.ip

  // Check for suspicious user agents
  const suspiciousAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]

  if (suspiciousAgents.some(pattern => pattern.test(userAgent))) {
    logger.security('Suspicious user agent detected', {
      ip,
      userAgent,
      url: req.url,
      method: req.method
    })

    // Apply stricter rate limiting for bots
    req.rateLimitMultiplier = 0.1 // 10% of normal rate limit
  }

  next()
}

// Request size validation
export const validateRequestSize = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = req.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.security('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize,
        url: req.url,
        method: req.method
      })

      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: `${maxSize / 1024 / 1024}MB`
      })
    }

    next()
  }
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: {
    page: {
      type: 'number',
      integer: true,
      minimum: 1,
      default: 1
    },
    limit: {
      type: 'number',
      integer: true,
      minimum: 1,
      maximum: 100,
      default: 20
    },
    sort: {
      type: 'string',
      default: 'created_at'
    },
    order: {
      type: 'string',
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  },

  // User registration
  userRegistration: {
    username: {
      type: 'string',
      min: 3,
      max: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      required: true
    },
    password: {
      type: 'string',
      min: 8,
      max: 128,
      required: true
    },
    role: {
      type: 'string',
      enum: ['student', 'teacher', 'admin'],
      required: true
    },
    firstName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    lastName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    email: {
      type: 'string',
      format: 'email',
      max: 100
    }
  },

  // Student creation/update
  student: {
    firstName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    lastName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    email: {
      type: 'string',
      format: 'email',
      max: 100
    },
    phone: {
      type: 'string',
      max: 20,
      pattern: /^[+]?[\d\s\-\(\)]+$/
    },
    classId: {
      type: 'number',
      integer: true,
      minimum: 1
    },
    dateOfBirth: {
      type: 'string',
      format: 'date'
    },
    gender: {
      type: 'string',
      enum: ['Male', 'Female', 'Other']
    }
  },

  // Teacher creation/update
  teacher: {
    firstName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    lastName: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    email: {
      type: 'string',
      format: 'email',
      max: 100,
      required: true
    },
    phone: {
      type: 'string',
      max: 20,
      pattern: /^[+]?[\d\s\-\(\)]+$/
    },
    departmentId: {
      type: 'number',
      integer: true,
      minimum: 1
    },
    qualification: {
      type: 'string',
      max: 100
    },
    hireDate: {
      type: 'string',
      format: 'date'
    }
  },

  // Class creation/update
  class: {
    name: {
      type: 'string',
      min: 1,
      max: 50,
      required: true
    },
    grade: {
      type: 'string',
      min: 1,
      max: 20,
      required: true
    },
    section: {
      type: 'string',
      max: 10
    },
    maxStudents: {
      type: 'number',
      integer: true,
      minimum: 1,
      maximum: 100,
      default: 40
    },
    homeroomTeacherId: {
      type: 'number',
      integer: true,
      minimum: 1
    }
  },

  // Subject creation/update
  subject: {
    name: {
      type: 'string',
      min: 1,
      max: 100,
      required: true
    },
    code: {
      type: 'string',
      min: 1,
      max: 20,
      pattern: /^[A-Z0-9]+$/,
      required: true
    },
    description: {
      type: 'string',
      max: 500
    },
    maxMarks: {
      type: 'number',
      integer: true,
      minimum: 1,
      maximum: 1000,
      default: 100
    },
    passingMarks: {
      type: 'number',
      integer: true,
      minimum: 0,
      maximum: 1000,
      default: 40
    },
    departmentId: {
      type: 'number',
      integer: true,
      minimum: 1
    }
  },

  // Marks entry
  marks: {
    studentId: {
      type: 'number',
      integer: true,
      minimum: 1,
      required: true
    },
    subjectId: {
      type: 'number',
      integer: true,
      minimum: 1,
      required: true
    },
    classId: {
      type: 'number',
      integer: true,
      minimum: 1,
      required: true
    },
    examTypeId: {
      type: 'number',
      integer: true,
      minimum: 1,
      required: true
    },
    marksObtained: {
      type: 'number',
      minimum: 0,
      required: true
    },
    maxMarks: {
      type: 'number',
      integer: true,
      minimum: 1,
      required: true
    },
    remarks: {
      type: 'string',
      max: 500
    }
  }
}

// Error handling middleware
export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    logger.security('Validation error', {
      error: err.message,
      url: req.url,
      method: req.method,
      userId: req.user?.id
    })

    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    })
  }

  next(err)
}
