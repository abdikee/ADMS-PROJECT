#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import pool from '../backend/config/database.js'
import logger from '../backend/config/logger.js'

const execAsync = promisify(exec)

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(process.cwd(), 'database', 'migrations')
    this.schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    this.gdprSchemaPath = path.join(process.cwd(), 'database', 'gdpr-schema.sql')
  }

  async initialize() {
    try {
      // Create migrations table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64) NOT NULL
        )
      `)
      
      logger.info('Migration system initialized')
    } catch (error) {
      logger.error('Failed to initialize migration system', { error: error.message })
      throw error
    }
  }

  async createMigration(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${timestamp}_${name}.sql`
    const filepath = path.join(this.migrationsPath, filename)
    
    const migrationTemplate = `-- Migration: ${name}
-- Description: ${description}
-- Created: ${new Date().toISOString()}

-- UP migration
-- Add your SQL statements here

-- DOWN migration (for rollback)
-- Add rollback statements here
`

    try {
      await fs.mkdir(this.migrationsPath, { recursive: true })
      await fs.writeFile(filepath, migrationTemplate)
      
      logger.info('Migration created', { filename, filepath })
      return filepath
    } catch (error) {
      logger.error('Failed to create migration', { error: error.message })
      throw error
    }
  }

  async getExecutedMigrations() {
    try {
      const [result] = await pool.query(
        'SELECT filename, executed_at, checksum FROM migrations ORDER BY executed_at'
      )
      return result
    } catch (error) {
      logger.error('Failed to get executed migrations', { error: error.message })
      return []
    }
  }

  async getPendingMigrations() {
    try {
      const migrationFiles = await fs.readdir(this.migrationsPath)
      const executedMigrations = await this.getExecutedMigrations()
      const executedFilenames = new Set(executedMigrations.map(m => m.filename))
      
      const pendingMigrations = []
      
      for (const file of migrationFiles) {
        if (file.endsWith('.sql') && !executedFilenames.has(file)) {
          const filepath = path.join(this.migrationsPath, file)
          const content = await fs.readFile(filepath, 'utf8')
          const checksum = this.calculateChecksum(content)
          
          pendingMigrations.push({
            filename: file,
            filepath,
            content,
            checksum
          })
        }
      }
      
      // Sort by filename (which includes timestamp)
      pendingMigrations.sort((a, b) => a.filename.localeCompare(b.filename))
      
      return pendingMigrations
    } catch (error) {
      logger.error('Failed to get pending migrations', { error: error.message })
      return []
    }
  }

  calculateChecksum(content) {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  async executeMigration(migration) {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      // Extract UP and DOWN migrations
      const { upMigration, downMigration } = this.parseMigrationContent(migration.content)
      
      // Execute UP migration
      if (upMigration.trim()) {
        await connection.query(upMigration)
        logger.info('UP migration executed', { filename: migration.filename })
      }
      
      // Record migration
      await connection.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
        [migration.filename, migration.checksum]
      )
      
      await connection.commit()
      logger.info('Migration completed', { filename: migration.filename })
      
    } catch (error) {
      await connection.rollback()
      logger.error('Migration failed', { filename: migration.filename, error: error.message })
      throw error
    } finally {
      connection.release()
    }
  }

  parseMigrationContent(content) {
    const lines = content.split('\n')
    let upMigration = []
    let downMigration = []
    let currentSection = 'up'
    
    for (const line of lines) {
      if (line.trim().startsWith('-- DOWN migration')) {
        currentSection = 'down'
        continue
      }
      
      if (line.trim().startsWith('-- UP migration')) {
        currentSection = 'up'
        continue
      }
      
      if (currentSection === 'up') {
        upMigration.push(line)
      } else {
        downMigration.push(line)
      }
    }
    
    return {
      upMigration: upMigration.join('\n'),
      downMigration: downMigration.join('\n')
    }
  }

  async rollbackMigration(migration) {
    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()
      
      // Extract DOWN migration
      const { downMigration } = this.parseMigrationContent(migration.content)
      
      // Execute DOWN migration
      if (downMigration.trim()) {
        await connection.query(downMigration)
        logger.info('DOWN migration executed', { filename: migration.filename })
      }
      
      // Remove migration record
      await connection.query(
        'DELETE FROM migrations WHERE filename = $1',
        [migration.filename]
      )
      
      await connection.commit()
      logger.info('Migration rollback completed', { filename: migration.filename })
      
    } catch (error) {
      await connection.rollback()
      logger.error('Migration rollback failed', { filename: migration.filename, error: error.message })
      throw error
    } finally {
      connection.release()
    }
  }

  async migrateUp() {
    try {
      await this.initialize()
      
      const pendingMigrations = await this.getPendingMigrations()
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations')
        return
      }
      
      logger.info('Starting migrations', { count: pendingMigrations.length })
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }
      
      logger.info('All migrations completed successfully')
      
    } catch (error) {
      logger.error('Migration failed', { error: error.message })
      throw error
    }
  }

  async migrateDown(steps = 1) {
    try {
      await this.initialize()
      
      const executedMigrations = await this.getExecutedMigrations()
      
      if (executedMigrations.length === 0) {
        logger.info('No migrations to rollback')
        return
      }
      
      // Get the last N migrations to rollback
      const migrationsToRollback = executedMigrations
        .sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at))
        .slice(0, steps)
      
      logger.info('Starting rollback', { count: migrationsToRollback.length })
      
      for (const migrationRecord of migrationsToRollback) {
        const filepath = path.join(this.migrationsPath, migrationRecord.filename)
        const content = await fs.readFile(filepath, 'utf8')
        const checksum = this.calculateChecksum(content)
        
        const migration = {
          filename: migrationRecord.filename,
          filepath,
          content,
          checksum
        }
        
        await this.rollbackMigration(migration)
      }
      
      logger.info('Rollback completed successfully')
      
    } catch (error) {
      logger.error('Rollback failed', { error: error.message })
      throw error
    }
  }

  async getCurrentVersion() {
    try {
      const executedMigrations = await this.getExecutedMigrations()
      
      if (executedMigrations.length === 0) {
        return '0.0.0'
      }
      
      const lastMigration = executedMigrations[executedMigrations.length - 1]
      const timestamp = lastMigration.filename.split('_')[0]
      
      return timestamp
    } catch (error) {
      logger.error('Failed to get current version', { error: error.message })
      return 'unknown'
    }
  }

  async initializeDatabase() {
    try {
      logger.info('Initializing database with schema...')
      
      // Read and execute main schema
      const schemaContent = await fs.readFile(this.schemaPath, 'utf8')
      await pool.query(schemaContent)
      
      // Read and execute GDPR schema
      const gdprSchemaContent = await fs.readFile(this.gdprSchemaPath, 'utf8')
      await pool.query(gdprSchemaContent)
      
      logger.info('Database schema initialized successfully')
      
    } catch (error) {
      logger.error('Database initialization failed', { error: error.message })
      throw error
    }
  }

  async resetDatabase() {
    try {
      logger.warn('Resetting database - this will delete all data!')
      
      // Drop all tables (except migrations)
      const [tables] = await pool.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename != 'migrations'
      `)
      
      for (const table of tables) {
        await pool.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`)
      }
      
      // Re-initialize schema
      await this.initializeDatabase()
      
      logger.info('Database reset completed')
      
    } catch (error) {
      logger.error('Database reset failed', { error: error.message })
      throw error
    }
  }

  async getStatus() {
    try {
      await this.initialize()
      
      const executedMigrations = await this.getExecutedMigrations()
      const pendingMigrations = await this.getPendingMigrations()
      const currentVersion = await this.getCurrentVersion()
      
      return {
        currentVersion,
        executedMigrations: executedMigrations.length,
        pendingMigrations: pendingMigrations.length,
        lastMigration: executedMigrations.length > 0 ? executedMigrations[executedMigrations.length - 1] : null,
        status: pendingMigrations.length === 0 ? 'up-to-date' : 'pending'
      }
    } catch (error) {
      logger.error('Failed to get migration status', { error: error.message })
      return { status: 'error', error: error.message }
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const migrator = new DatabaseMigrator()
  
  try {
    switch (command) {
      case 'init':
        await migrator.initializeDatabase()
        break
      case 'up':
        await migrator.migrateUp()
        break
      case 'down':
        const steps = parseInt(process.argv[3]) || 1
        await migrator.migrateDown(steps)
        break
      case 'create':
        const name = process.argv[3]
        const description = process.argv[4] || ''
        if (!name) {
          console.error('Migration name is required')
          process.exit(1)
        }
        await migrator.createMigration(name, description)
        break
      case 'status':
        const status = await migrator.getStatus()
        console.log('Migration Status:')
        console.log(`Current Version: ${status.currentVersion}`)
        console.log(`Executed Migrations: ${status.executedMigrations}`)
        console.log(`Pending Migrations: ${status.pendingMigrations}`)
        console.log(`Status: ${status.status}`)
        break
      case 'reset':
        await migrator.resetDatabase()
        break
      default:
        console.log('Usage: node migrate.js [init|up|down|create|status|reset] [options]')
        console.log('  init                    - Initialize database with schema')
        console.log('  up                      - Run pending migrations')
        console.log('  down [steps]            - Rollback last N migrations')
        console.log('  create <name> [desc]    - Create new migration file')
        console.log('  status                  - Show migration status')
        console.log('  reset                   - Reset database (WARNING: deletes all data)')
    }
  } catch (error) {
    logger.error('Migration command failed', { error: error.message })
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default DatabaseMigrator
