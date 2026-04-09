import request from 'supertest'
import app from '../server.js'
import jwt from 'jsonwebtoken'

describe('Student Management', () => {
  let authToken
  let adminToken

  beforeAll(async () => {
    // Create tokens for testing
    authToken = jwt.sign(
      { id: 1, username: 'testuser', role: 'student' },
      process.env.JWT_SECRET
    )
    
    adminToken = jwt.sign(
      { id: 2, username: 'admin', role: 'admin' },
      process.env.JWT_SECRET
    )
  })

  describe('GET /api/students', () => {
    it('should return all students for authenticated users', async () => {
      const mockStudents = [
        {
          id: 1,
          first_name: 'Test',
          last_name: 'Student',
          email: 'test@student.com',
          class_name: 'Grade 10A',
          grade: '10',
          is_active: true
        }
      ]

      const { default: pool } = await import('../config/database.js')
      pool.query.mockResolvedValueOnce([mockStudents])

      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body[0]).toHaveProperty('first_name')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/students')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/students', () => {
    it('should create a new student (admin only)', async () => {
      const newStudent = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        classId: 1,
        username: 'johndoe',
        password: 'password123'
      }

      const { default: pool } = await import('../config/database.js')
      const mockConnection = {
        query: jest.fn().mockResolvedValue([[{ id: 1 }]]),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      }
      
      pool.getConnection.mockResolvedValue(mockConnection)

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStudent)

      expect(response.status).toBe(201)
      expect(mockConnection.beginTransaction).toHaveBeenCalled()
      expect(mockConnection.commit).toHaveBeenCalled()
    })

    it('should reject non-admin users', async () => {
      const newStudent = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      }

      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newStudent)

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/students/:id', () => {
    it('should update a student (admin only)', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      }

      const { default: pool } = await import('../config/database.js')
      pool.query.mockResolvedValueOnce([])

      const response = await request(app)
        .put('/api/students/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)

      expect(response.status).toBe(200)
    })

    it('should reject non-admin users', async () => {
      const updates = {
        firstName: 'Updated'
      }

      const response = await request(app)
        .put('/api/students/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/students/:id', () => {
    it('should soft delete a student (admin only)', async () => {
      const { default: pool } = await import('../config/database.js')
      pool.query.mockResolvedValueOnce([])

      const response = await request(app)
        .delete('/api/students/1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
    })

    it('should reject non-admin users', async () => {
      const response = await request(app)
        .delete('/api/students/1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/students/:id/generate-credentials', () => {
    it('should generate credentials for a student (admin only)', async () => {
      const mockStudent = {
        id: 1,
        user_id: 1,
        first_name: 'Test',
        last_name: 'Student'
      }

      const { default: pool } = await import('../config/database.js')
      const mockConnection = {
        query: jest.fn().mockResolvedValue([[mockStudent]]),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      }
      
      pool.getConnection.mockResolvedValue(mockConnection)

      const response = await request(app)
        .post('/api/students/1/generate-credentials')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('username')
      expect(response.body).toHaveProperty('password')
      expect(response.body.username).toMatch(/^stu_/)
    })
  })
})
