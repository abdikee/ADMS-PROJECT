import bcrypt from 'bcrypt';
import pool from '../config/database.js';

function readArgument(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return '';
  }

  return String(process.argv[index + 1] || '').trim();
}

function getBootstrapInput() {
  const username = readArgument('--username') || process.env.BOOTSTRAP_ADMIN_USERNAME;
  const password = readArgument('--password') || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = readArgument('--name') || process.env.BOOTSTRAP_ADMIN_NAME || 'System Administrator';
  const email = readArgument('--email') || process.env.BOOTSTRAP_ADMIN_EMAIL || '';

  if (!username || !password) {
    throw new Error(
      'Usage: node scripts/bootstrap-admin.js --username <username> --password <password> [--name "Full Name"] [--email email@example.com]'
    );
  }

  if (password.length < 12) {
    throw new Error('Bootstrap admin password must be at least 12 characters long');
  }

  return { username, password, fullName, email };
}

async function ensureUserProfilesTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE,
      full_name VARCHAR(120),
      email VARCHAR(120),
      phone VARCHAR(30),
      profile_photo VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function bootstrapAdmin() {
  let connection;

  try {
    connection = await pool.getConnection();
    const { username, password, fullName, email } = getBootstrapInput();

    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (existingUsers.length > 0) {
      throw new Error(`User "${username}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await connection.query(
      'INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, TRUE)',
      [username, hashedPassword, 'admin']
    );

    await ensureUserProfilesTable(connection);
    await connection.query(
      'INSERT INTO user_profiles (user_id, full_name, email) VALUES (?, ?, ?)',
      [result.insertId, fullName, email || null]
    );

    await connection.commit();
    console.log(`Admin account created successfully for username "${username}"`);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error(error.message || error.code || 'Failed to connect to the database');
    process.exitCode = 1;
  } finally {
    connection?.release();
    await pool.end();
  }
}

bootstrapAdmin();
