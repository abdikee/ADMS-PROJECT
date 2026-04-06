import { Pool } from 'pg';
import { env } from './env.js';

function isInsertStatement(sql) {
  return /^\s*insert\s+/i.test(sql);
}

function hasReturningClause(sql) {
  return /\breturning\b/i.test(sql);
}

function convertPlaceholders(sql, params) {
  const safeParams = params || [];

  // If SQL already uses $1-style placeholders, pass through unchanged
  if (/\$\d+/.test(sql)) {
    return { sql, params: safeParams };
  }

  // Otherwise convert ? placeholders to $N for pg
  let paramIndex = 0;
  let placeholderIndex = 1;
  const convertedParams = [];

  const convertedSql = sql.replace(/\?/g, () => {
    const value = safeParams[paramIndex];
    paramIndex += 1;

    if (Array.isArray(value)) {
      if (value.length === 0) return 'NULL';
      const placeholders = value.map((item) => {
        convertedParams.push(item);
        return '$' + (placeholderIndex++);
      });
      return placeholders.join(', ');
    }

    convertedParams.push(value);
    return '$' + (placeholderIndex++);
  });

  return { sql: convertedSql, params: convertedParams };
}

function normalizeSql(sql) {
  const trimmedSql = sql.trim();
  if (isInsertStatement(trimmedSql) && !hasReturningClause(trimmedSql)) {
    return trimmedSql + ' RETURNING id';
  }
  return trimmedSql;
}

function mapError(error) {
  if (error && error.code === '23505') {
    error.code = 'ER_DUP_ENTRY';
  }
  return error;
}

function normalizeResult(originalSql, result) {
  if (isInsertStatement(originalSql)) {
    return [{
      insertId: result.rows && result.rows[0] ? result.rows[0].id : null,
      rowCount: result.rowCount,
      rows: result.rows,
    }];
  }
  return [result.rows];
}

class PostgresConnection {
  constructor(client) {
    this.client = client;
  }

  async query(sql, params) {
    try {
      const statement = convertPlaceholders(normalizeSql(sql), params || []);
      const result = await this.client.query(statement.sql, statement.params);
      return normalizeResult(sql, result);
    } catch (error) {
      throw mapError(error);
    }
  }

  async beginTransaction() {
    await this.client.query('BEGIN');
  }

  async commit() {
    await this.client.query('COMMIT');
  }

  async rollback() {
    await this.client.query('ROLLBACK');
  }

  release() {
    this.client.release();
  }
}

class PostgresPoolAdapter {
  constructor() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async query(sql, params) {
    const client = await this.pool.connect();
    try {
      const connection = new PostgresConnection(client);
      return await connection.query(sql, params || []);
    } finally {
      client.release();
    }
  }

  async getConnection() {
    const client = await this.pool.connect();
    return new PostgresConnection(client);
  }

  async end() {
    await this.pool.end();
  }
}

const pool = new PostgresPoolAdapter();

pool.query('SELECT 1')
  .then(() => { console.log('Database connected successfully'); })
  .catch((error) => {
    console.error('Database connection failed:', error.message || error.code || 'Unknown connection error');
  });

export default pool;
