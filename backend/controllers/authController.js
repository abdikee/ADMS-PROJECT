import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const isBcryptHash = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isBcryptHash) {
      console.error(`Rejected login for user ${user.username}: password is not bcrypt-hashed`);
      return res.status(500).json({ error: 'Account password is not configured securely. Contact an administrator.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let userData = { id: user.id, username: user.username, role: user.role };

    if (user.role === 'student') {
      const [students] = await pool.query(
        'SELECT id, first_name, last_name, email FROM students WHERE user_id = $1',
        [user.id]
      );
      if (students.length > 0) {
        userData.studentId = students[0].id;
        userData.name = `${students[0].first_name} ${students[0].last_name}`;
        userData.email = students[0].email;
      }
    } else if (user.role === 'teacher') {
      const [teachers] = await pool.query(
        'SELECT id, first_name, last_name, email FROM teachers WHERE user_id = $1',
        [user.id]
      );
      if (teachers.length > 0) {
        userData.teacherId = teachers[0].id;
        userData.name = `${teachers[0].first_name} ${teachers[0].last_name}`;
        userData.email = teachers[0].email;
      }
    } else {
      userData.name = 'Administrator';
      userData.email = 'admin@edurecord.com';
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, ...userData },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({ token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, role, firstName, lastName, email } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role]
    );

    const userId = result[0].id;

    if (role === 'student' && firstName && lastName) {
      await pool.query(
        'INSERT INTO students (user_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
        [userId, firstName, lastName, email]
      );
    } else if (role === 'teacher' && firstName && lastName) {
      await pool.query(
        'INSERT INTO teachers (user_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
        [userId, firstName, lastName, email]
      );
    }

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};
