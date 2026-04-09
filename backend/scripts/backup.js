#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import logger from '../config/logger.js'
import { env } from '../config/env.js'
import redisClient from '../config/redis.js'

const execAsync = promisify(exec)

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups')
    this.maxBackups = 30 // Keep last 30 days of backups
    this.compressionEnabled = true
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'database'), { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'files'), { recursive: true })
      await fs.mkdir(path.join(this.backupDir, 'logs'), { recursive: true })
      logger.info('Backup directories created')
    } catch (error) {
      logger.error('Failed to create backup directories', { error: error.message })
      throw error
    }
  }

  // Database backup
  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `database_backup_${timestamp}.sql`
    const filepath = path.join(this.backupDir, 'database', filename)
    
    try {
      logger.info('Starting database backup')
      
      // Extract database connection details from DATABASE_URL
      const dbUrl = new URL(env.DATABASE_URL)
      const pgDumpCommand = `PGPASSWORD=${dbUrl.password} pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} > "${filepath}"`
      
      await execAsync(pgDumpCommand)
      
      // Compress the backup file
      if (this.compressionEnabled) {
        await this.compressFile(filepath)
        await fs.unlink(filepath) // Remove uncompressed file
        filepath += '.gz'
      }
      
      logger.info('Database backup completed', { filename: path.basename(filepath) })
      return filepath
    } catch (error) {
      logger.error('Database backup failed', { error: error.message })
      throw error
    }
  }

  // Redis backup
  async backupRedis() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `redis_backup_${timestamp}.rdb`
    const filepath = path.join(this.backupDir, 'database', filename)
    
    try {
      logger.info('Starting Redis backup')
      
      if (!redisClient.isConnected) {
        await redisClient.connect()
      }
      
      // Trigger Redis BGSAVE
      await redisClient.client.bgSave()
      
      // Wait for background save to complete
      let lastSaveTime = await redisClient.client.lastSave()
      let currentSaveTime = lastSaveTime
      
      while (currentSaveTime === lastSaveTime) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        currentSaveTime = await redisClient.client.lastSave()
      }
      
      // Copy the RDB file
      const redisDir = '/var/lib/redis' // Default Redis data directory
      const sourceFile = path.join(redisDir, 'dump.rdb')
      
      try {
        await fs.copyFile(sourceFile, filepath)
      } catch (error) {
        // If we can't access the Redis directory, create a manual backup
        const redisData = await redisClient.client.info('memory')
        await fs.writeFile(filepath, redisData, 'utf8')
      }
      
      logger.info('Redis backup completed', { filename: path.basename(filepath) })
      return filepath
    } catch (error) {
      logger.error('Redis backup failed', { error: error.message })
      throw error
    }
  }

  // File system backup
  async backupFiles() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `files_backup_${timestamp}.tar.gz`
    const filepath = path.join(this.backupDir, 'files', filename)
    
    try {
      logger.info('Starting file system backup')
      
      const sourceDirs = [
        'uploads',
        'logs',
        'public/files'
      ]
      
      const existingDirs = []
      for (const dir of sourceDirs) {
        try {
          await fs.access(dir)
          existingDirs.push(dir)
        } catch {
          logger.warn('Directory not found for backup', { directory: dir })
        }
      }
      
      if (existingDirs.length > 0) {
        const tarCommand = `tar -czf "${filepath}" ${existingDirs.join(' ')}`
        await execAsync(tarCommand)
      } else {
        // Create empty backup file
        await fs.writeFile(filepath, '', 'utf8')
      }
      
      logger.info('File system backup completed', { filename: path.basename(filepath) })
      return filepath
    } catch (error) {
      logger.error('File system backup failed', { error: error.message })
      throw error
    }
  }

  // Configuration backup
  async backupConfig() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `config_backup_${timestamp}.tar.gz`
    const filepath = path.join(this.backupDir, 'config', filename)
    
    try {
      logger.info('Starting configuration backup')
      
      const configFiles = [
        '.env',
        'package.json',
        'server.js',
        'config/',
        'scripts/'
      ]
      
      const existingFiles = []
      for (const file of configFiles) {
        try {
          await fs.access(file)
          existingFiles.push(file)
        } catch {
          logger.warn('Config file not found for backup', { file })
        }
      }
      
      if (existingFiles.length > 0) {
        const tarCommand = `tar -czf "${filepath}" ${existingFiles.join(' ')}`
        await execAsync(tarCommand)
      } else {
        await fs.writeFile(filepath, '', 'utf8')
      }
      
      logger.info('Configuration backup completed', { filename: path.basename(filepath) })
      return filepath
    } catch (error) {
      logger.error('Configuration backup failed', { error: error.message })
      throw error
    }
  }

  // Full system backup
  async fullBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupManifest = {
      timestamp,
      type: 'full',
      components: {}
    }
    
    try {
      logger.info('Starting full system backup')
      
      // Run all backup types
      const databaseBackup = await this.backupDatabase()
      backupManifest.components.database = path.basename(databaseBackup)
      
      const redisBackup = await this.backupRedis()
      backupManifest.components.redis = path.basename(redisBackup)
      
      const filesBackup = await this.backupFiles()
      backupManifest.components.files = path.basename(filesBackup)
      
      const configBackup = await this.backupConfig()
      backupManifest.components.config = path.basename(configBackup)
      
      // Save backup manifest
      const manifestPath = path.join(this.backupDir, `manifest_${timestamp}.json`)
      await fs.writeFile(manifestPath, JSON.stringify(backupManifest, null, 2))
      
      // Clean up old backups
      await this.cleanupOldBackups()
      
      logger.info('Full system backup completed', { 
        timestamp,
        components: Object.keys(backupManifest.components)
      })
      
      return backupManifest
    } catch (error) {
      logger.error('Full system backup failed', { error: error.message })
      throw error
    }
  }

  // Restore from backup
  async restoreFromBackup(backupTimestamp) {
    const manifestPath = path.join(this.backupDir, `manifest_${backupTimestamp}.json`)
    
    try {
      logger.info('Starting restore from backup', { timestamp: backupTimestamp })
      
      // Read backup manifest
      const manifestData = await fs.readFile(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestData)
      
      // Restore database
      if (manifest.components.database) {
        await this.restoreDatabase(path.join(this.backupDir, 'database', manifest.components.database))
      }
      
      // Restore Redis
      if (manifest.components.redis) {
        await this.restoreRedis(path.join(this.backupDir, 'database', manifest.components.redis))
      }
      
      // Restore files
      if (manifest.components.files) {
        await this.restoreFiles(path.join(this.backupDir, 'files', manifest.components.files))
      }
      
      // Restore config
      if (manifest.components.config) {
        await this.restoreConfig(path.join(this.backupDir, 'config', manifest.components.config))
      }
      
      logger.info('Restore completed successfully', { timestamp: backupTimestamp })
    } catch (error) {
      logger.error('Restore failed', { error: error.message, timestamp: backupTimestamp })
      throw error
    }
  }

  // Restore database
  async restoreDatabase(backupFile) {
    try {
      logger.info('Restoring database')
      
      let sqlFile = backupFile
      if (backupFile.endsWith('.gz')) {
        sqlFile = await this.decompressFile(backupFile)
      }
      
      const dbUrl = new URL(env.DATABASE_URL)
      const psqlCommand = `PGPASSWORD=${dbUrl.password} psql -h ${dbUrl.hostname} -p ${dbUrl.port || 5432} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} < "${sqlFile}"`
      
      await execAsync(psqlCommand)
      
      // Clean up decompressed file if needed
      if (sqlFile !== backupFile) {
        await fs.unlink(sqlFile)
      }
      
      logger.info('Database restore completed')
    } catch (error) {
      logger.error('Database restore failed', { error: error.message })
      throw error
    }
  }

  // Cleanup old backups
  async cleanupOldBackups() {
    try {
      logger.info('Cleaning up old backups')
      
      const backupTypes = ['database', 'files', 'config']
      
      for (const type of backupTypes) {
        const typeDir = path.join(this.backupDir, type)
        const files = await fs.readdir(typeDir)
        
        // Sort files by modification time (newest first)
        const fileStats = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(typeDir, file)
            const stats = await fs.stat(filePath)
            return { file, filePath, mtime: stats.mtime }
          })
        )
        
        fileStats.sort((a, b) => b.mtime - a.mtime)
        
        // Keep only the most recent backups
        const filesToDelete = fileStats.slice(this.maxBackups)
        
        for (const { filePath, file } of filesToDelete) {
          await fs.unlink(filePath)
          logger.info('Deleted old backup', { file })
        }
      }
      
      logger.info('Backup cleanup completed')
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message })
    }
  }

  // Utility functions
  async compressFile(filepath) {
    const gzipCommand = `gzip "${filepath}"`
    await execAsync(gzipCommand)
  }

  async decompressFile(filepath) {
    const gunzipCommand = `gunzip -c "${filepath}" > "${filepath.replace('.gz', '')}"`
    await execAsync(gunzipCommand)
    return filepath.replace('.gz', '')
  }

  // List available backups
  async listBackups() {
    try {
      const manifestFiles = await fs.readdir(this.backupDir)
      const backupManifests = []
      
      for (const file of manifestFiles) {
        if (file.startsWith('manifest_') && file.endsWith('.json')) {
          const manifestPath = path.join(this.backupDir, file)
          const manifestData = await fs.readFile(manifestPath, 'utf8')
          const manifest = JSON.parse(manifestData)
          backupManifests.push(manifest)
        }
      }
      
      // Sort by timestamp (newest first)
      backupManifests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      return backupManifests
    } catch (error) {
      logger.error('Failed to list backups', { error: error.message })
      return []
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const backupManager = new BackupManager()
  
  try {
    await backupManager.initialize()
    
    switch (command) {
      case 'full':
        await backupManager.fullBackup()
        break
      case 'database':
        await backupManager.backupDatabase()
        break
      case 'redis':
        await backupManager.backupRedis()
        break
      case 'files':
        await backupManager.backupFiles()
        break
      case 'config':
        await backupManager.backupConfig()
        break
      case 'list':
        const backups = await backupManager.listBackups()
        console.log('Available backups:')
        backups.forEach(backup => {
          console.log(`- ${backup.timestamp} (${backup.type})`)
        })
        break
      case 'restore':
        const timestamp = process.argv[3]
        if (!timestamp) {
          console.error('Please provide backup timestamp')
          process.exit(1)
        }
        await backupManager.restoreFromBackup(timestamp)
        break
      default:
        console.log('Usage: node backup.js [full|database|redis|files|config|list|restore <timestamp>]')
    }
  } catch (error) {
    logger.error('Backup operation failed', { error: error.message })
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default BackupManager
