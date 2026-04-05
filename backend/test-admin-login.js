import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminLogin() {
  let connection;
  
  try {
    console.log('=================================');
    console.log('Testing Admin Login');
    console.log('=================================\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'abdike',
      password: process.env.DB_PASSWORD || 'abdike@3132',
      database: process.env.DB_NAME || 'sams_db'
    });

    console.log('✅ Connected to database\n');

    // Get admin user
    const [users] = await connection.query(
      'SELECT id, username, password, role, is_active FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      console.log('❌ Admin user not found in database!');
      console.log('Creating admin user...\n');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin', true]
      );
      
      console.log('✅ Admin user created!');
      console.log('Username: admin');
      console.log('Password: admin123\n');
      
    } else {
      const user = users[0];
      console.log('Admin user found:');
      console.log('- ID:', user.id);
      console.log('- Username:', user.username);
      console.log('- Role:', user.role);
      console.log('- Active:', user.is_active);
      console.log('- Password Hash:', user.password.substring(0, 20) + '...\n');

      // Test password
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      
      if (isValid) {
        console.log('✅ Password "admin123" is CORRECT!');
      } else {
        console.log('❌ Password "admin123" is INCORRECT!');
        console.log('Updating password...\n');
        
        const newHash = await bcrypt.hash('admin123', 10);
        await connection.query(
          'UPDATE users SET password = ?, is_active = TRUE WHERE username = ?',
          [newHash, 'admin']
        );
        
        console.log('✅ Password updated to: admin123');
      }

      // Check if user is active
      if (!user.is_active) {
        console.log('\n⚠️  User is INACTIVE! Activating...');
        await connection.query(
          'UPDATE users SET is_active = TRUE WHERE username = ?',
          ['admin']
        );
        console.log('✅ User activated!');
      }
    }

    console.log('\n=================================');
    console.log('Final Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('=================================\n');

    // Show all users in database
    const [allUsers] = await connection.query(
      'SELECT id, username, role, is_active FROM users ORDER BY id'
    );
    
    console.log('All users in database:');
    console.table(allUsers);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Cannot connect to MySQL database!');
      console.log('Make sure MySQL is running on localhost:3306');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAdminLogin();
