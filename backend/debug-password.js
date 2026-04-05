import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function debugPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'abdike',
      password: process.env.DB_PASSWORD || 'abdike@3132',
      database: process.env.DB_NAME || 'sams_db'
    });

    console.log('Getting admin user from database...\n');

    const [users] = await connection.query(
      'SELECT id, username, password, role, is_active FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }

    const user = users[0];
    console.log('User found:');
    console.log('- Username:', user.username);
    console.log('- Role:', user.role);
    console.log('- Active:', user.is_active);
    console.log('- Full Password Hash:', user.password);
    console.log('- Hash Length:', user.password.length);
    console.log('- Hash starts with $2b$10$:', user.password.startsWith('$2b$10$'));
    
    console.log('\n--- Testing Different Passwords ---\n');
    
    const testPasswords = ['admin123', 'admin', 'Admin123', ''];
    
    for (const testPwd of testPasswords) {
      try {
        const result = await bcrypt.compare(testPwd, user.password);
        console.log(`Password "${testPwd}": ${result ? '✅ MATCH' : '❌ NO MATCH'}`);
      } catch (error) {
        console.log(`Password "${testPwd}": ❌ ERROR - ${error.message}`);
      }
    }

    console.log('\n--- Generating Fresh Hash ---\n');
    
    const freshHash = await bcrypt.hash('admin123', 10);
    console.log('New hash for "admin123":', freshHash);
    
    const freshTest = await bcrypt.compare('admin123', freshHash);
    console.log('Fresh hash test:', freshTest ? '✅ WORKS' : '❌ FAILED');
    
    console.log('\n--- Updating Database ---\n');
    
    await connection.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [freshHash, 'admin']
    );
    
    console.log('✅ Password updated in database');
    
    // Verify update
    const [updated] = await connection.query(
      'SELECT password FROM users WHERE username = ?',
      ['admin']
    );
    
    const verifyTest = await bcrypt.compare('admin123', updated[0].password);
    console.log('Verification after update:', verifyTest ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugPassword();
