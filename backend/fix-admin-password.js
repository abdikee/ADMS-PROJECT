import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: join(__dirname, '.env') });

async function fixAdminPassword() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'abdike',
      password: process.env.DB_PASSWORD || 'abdike@3132',
      database: process.env.DB_NAME || 'sams_db'
    });

    console.log('Connected to database successfully!');

    // Hash the password
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log('Generated password hash:', hashedPassword);

    // Check if admin user exists
    const [users] = await connection.query(
      'SELECT id, username, role FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      // Create admin user
      console.log('Admin user not found. Creating new admin user...');
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created successfully!');
    } else {
      // Update existing admin user
      console.log('Admin user found. Updating password...');
      await connection.query(
        'UPDATE users SET password = ?, is_active = TRUE WHERE username = ?',
        [hashedPassword, 'admin']
      );
      console.log('✅ Admin password updated successfully!');
    }

    console.log('\n=================================');
    console.log('Admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('=================================\n');

    // Verify the password works
    const [verifyUsers] = await connection.query(
      'SELECT password FROM users WHERE username = ?',
      ['admin']
    );
    
    if (verifyUsers.length > 0) {
      const isValid = await bcrypt.compare(plainPassword, verifyUsers[0].password);
      if (isValid) {
        console.log('✅ Password verification successful!');
      } else {
        console.log('❌ Password verification failed!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

fixAdminPassword();
