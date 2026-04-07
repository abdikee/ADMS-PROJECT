import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupLoginSecurity() {
  try {
    console.log('Setting up login security tables...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../database/add-login-attempts-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✓ Login security tables created successfully');
    console.log('✓ Login attempts tracking enabled');
    console.log('✓ Account lock mechanism configured');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up login security:', error);
    process.exit(1);
  }
}

setupLoginSecurity();
