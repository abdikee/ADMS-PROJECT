import request from 'supertest'
import app from '../server.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        is_active: true
      }

      const mockStudent = {
        id: 1,
        first_name: 'Test',
        last_name: 'Student',
        email: 'test@student.com'
      }

      // Mock database queries
      const { default: pool } = await import('../config/database.js')
      pool.query
        .mockResolvedValueOnce([[mockUser]]) // User query
        .mockResolvedValueOnce([[mockStudent]]) // Student query
        .mockResolvedValueOnce([]) // Failed attempt query
        .mockResolvedValueOnce([]) // Successful login query

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.role).toBe('student')
      
      // Verify JWT token
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET)
      expect(decoded.username).toBe('testuser')
      expect(decoded.role).toBe('student')
    })

    it('should reject invalid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        is_active: true,
        failed_login_count: 0
      }

      const { default: pool } = await import('../config/database.js')
      pool.query
        .mockResolvedValueOnce([[mockUser]]) // User query
        .mockResolvedValueOnce([{ failed_login_count: 0 }]) // Failed count query
        .mockResolvedValueOnce([]) // Record failed attempt
        .mockResolvedValueOnce([{ failed_login_count: 1 }]) // Update failed count

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject inactive users', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'student',
        is_active: false
      }

      const { default: pool } = await import('../config/database.js')
      pool.query.mockResolvedValueOnce([[mockUser]])

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Account is inactive')
    })

    it('should require username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Username and password required')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const { default: pool } = await import('../config/database.js')
      pool.query
        .mockResolvedValueOnce([[]]) // Check existing user
        .mockResolvedValueOnce([[{ id: 1 }]]) // Insert user
        .mockResolvedValueOnce([]) // Insert student

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'password123',
          role: 'student',
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com'
        })

      expect(response.status).toBe(201)
      expect(response.body.message).toBe('User created successfully')
    })

    it('should reject duplicate usernames', async () => {
      const { default: pool } = await import('../config/database.js')
      pool.query.mockResolvedValueOnce([[{ id: 1 }]]) // Existing user found

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123',
          role: 'student'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Username already exists')
    })
  })
})
