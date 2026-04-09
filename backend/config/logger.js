import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from './env.js'

// Custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`
    }
    
    if (stack) {
      log += `\n${stack}`
    }
    
    return log
  })
)

// Create logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: {
    service: 'sams-backend',
    environment: env.NODE_ENV
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // File transport for all logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // File transport for security events
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
})

// Security logging helper
logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, type: 'security' })
}

// Performance logging helper
logger.performance = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'performance' })
}

// API request logging helper
logger.api = (message, meta = {}) => {
  logger.info(message, { ...meta, type: 'api' })
}

// Database logging helper
logger.database = (message, meta = {}) => {
  logger.debug(message, { ...meta, type: 'database' })
}

export default logger
