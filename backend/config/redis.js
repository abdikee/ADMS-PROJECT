import { createClient } from 'redis'
import logger from './logger.js'
import { env } from './env.js'

class RedisClient {
  constructor() {
    this.client = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  async connect() {
    try {
      this.client = createClient({
        url: env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Redis reconnection failed', { attempts: retries })
              return new Error('Redis reconnection failed')
            }
            return Math.min(retries * 50, 1000)
          }
        }
      })

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message })
        this.isConnected = false
      })

      this.client.on('connect', () => {
        logger.info('Redis client connected')
        this.isConnected = true
        this.reconnectAttempts = 0
      })

      this.client.on('ready', () => {
        logger.info('Redis client ready')
      })

      this.client.on('end', () => {
        logger.warn('Redis client disconnected')
        this.isConnected = false
      })

      await this.client.connect()
      
      // Test connection
      await this.client.ping()
      logger.info('Redis connection established successfully')
      
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message })
      this.isConnected = false
      throw error
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect()
      this.isConnected = false
      logger.info('Redis client disconnected')
    }
  }

  // Cache operations with error handling
  async set(key, value, ttl = 3600) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache set', { key })
      return false
    }

    try {
      const serializedValue = JSON.stringify(value)
      await this.client.setEx(key, ttl, serializedValue)
      logger.database('Cache set', { key, ttl })
      return true
    } catch (error) {
      logger.error('Cache set failed', { key, error: error.message })
      return false
    }
  }

  async get(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache get', { key })
      return null
    }

    try {
      const value = await this.client.get(key)
      if (value) {
        const parsedValue = JSON.parse(value)
        logger.database('Cache hit', { key })
        return parsedValue
      }
      logger.database('Cache miss', { key })
      return null
    } catch (error) {
      logger.error('Cache get failed', { key, error: error.message })
      return null
    }
  }

  async del(key) {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache delete', { key })
      return false
    }

    try {
      await this.client.del(key)
      logger.database('Cache deleted', { key })
      return true
    } catch (error) {
      logger.error('Cache delete failed', { key, error: error.message })
      return false
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists check failed', { key, error: error.message })
      return false
    }
  }

  async flush() {
    if (!this.isConnected) {
      logger.warn('Redis not connected, skipping cache flush')
      return false
    }

    try {
      await this.client.flushDb()
      logger.database('Cache flushed')
      return true
    } catch (error) {
      logger.error('Cache flush failed', { error: error.message })
      return false
    }
  }

  // Advanced cache operations
  async setWithPattern(pattern, data, ttl = 3600) {
    if (!this.isConnected) return false

    try {
      const pipeline = this.client.multi()
      
      for (const [key, value] of Object.entries(data)) {
        const fullKey = `${pattern}:${key}`
        pipeline.setEx(fullKey, ttl, JSON.stringify(value))
      }
      
      await pipeline.exec()
      logger.database('Batch cache set', { pattern, count: Object.keys(data).length })
      return true
    } catch (error) {
      logger.error('Batch cache set failed', { pattern, error: error.message })
      return false
    }
  }

  async getWithPattern(pattern) {
    if (!this.isConnected) return {}

    try {
      const keys = await this.client.keys(`${pattern}:*`)
      const pipeline = this.client.multi()
      
      keys.forEach(key => pipeline.get(key))
      const results = await pipeline.exec()
      
      const data = {}
      keys.forEach((key, index) => {
        const shortKey = key.replace(`${pattern}:`, '')
        if (results[index][1]) {
          data[shortKey] = JSON.parse(results[index][1])
        }
      })
      
      logger.database('Pattern cache get', { pattern, count: Object.keys(data).length })
      return data
    } catch (error) {
      logger.error('Pattern cache get failed', { pattern, error: error.message })
      return {}
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) return false

    try {
      const keys = await this.client.keys(`${pattern}:*`)
      if (keys.length > 0) {
        await this.client.del(keys)
        logger.database('Pattern cache invalidated', { pattern, count: keys.length })
      }
      return true
    } catch (error) {
      logger.error('Pattern cache invalidation failed', { pattern, error: error.message })
      return false
    }
  }

  // Cache statistics
  async getInfo() {
    if (!this.isConnected) {
      return { connected: false }
    }

    try {
      const info = await this.client.info('memory')
      const keyspace = await this.client.info('keyspace')
      
      return {
        connected: true,
        info,
        keyspace
      }
    } catch (error) {
      logger.error('Failed to get Redis info', { error: error.message })
      return { connected: false, error: error.message }
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient()

// Cache helper functions
export const cache = {
  // User cache
  async getUser(userId) {
    return await redisClient.get(`user:${userId}`)
  },

  async setUser(userId, userData, ttl = 3600) {
    return await redisClient.set(`user:${userId}`, userData, ttl)
  },

  async invalidateUser(userId) {
    return await redisClient.del(`user:${userId}`)
  },

  // Student cache
  async getStudent(studentId) {
    return await redisClient.get(`student:${studentId}`)
  },

  async setStudent(studentId, studentData, ttl = 1800) {
    return await redisClient.set(`student:${studentId}`, studentData, ttl)
  },

  async invalidateStudent(studentId) {
    return await redisClient.del(`student:${studentId}`)
  },

  // Class cache
  async getClass(classId) {
    return await redisClient.get(`class:${classId}`)
  },

  async setClass(classId, classData, ttl = 1800) {
    return await redisClient.set(`class:${classId}`, classData, ttl)
  },

  async invalidateClass(classId) {
    return await redisClient.del(`class:${classId}`)
  },

  // Subject cache
  async getSubjects() {
    return await redisClient.get('subjects:all')
  },

  async setSubjects(subjects, ttl = 3600) {
    return await redisClient.set('subjects:all', subjects, ttl)
  },

  async invalidateSubjects() {
    return await redisClient.del('subjects:all')
  },

  // Academic years cache
  async getAcademicYears() {
    return await redisClient.get('academic_years:all')
  },

  async setAcademicYears(years, ttl = 7200) {
    return await redisClient.set('academic_years:all', years, ttl)
  },

  async invalidateAcademicYears() {
    return await redisClient.del('academic_years:all')
  },

  // Session cache
  async getSession(sessionId) {
    return await redisClient.get(`session:${sessionId}`)
  },

  async setSession(sessionId, sessionData, ttl = 3600) {
    return await redisClient.set(`session:${sessionId}`, sessionData, ttl)
  },

  async invalidateSession(sessionId) {
    return await redisClient.del(`session:${sessionId}`)
  },

  // Report cache
  async getReport(reportKey) {
    return await redisClient.get(`report:${reportKey}`)
  },

  async setReport(reportKey, reportData, ttl = 1800) {
    return await redisClient.set(`report:${reportKey}`, reportData, ttl)
  },

  async invalidateReport(reportKey) {
    return await redisClient.del(`report:${reportKey}`)
  }
}

export default redisClient
