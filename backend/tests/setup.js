import { jest } from '@jest/globals'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.CORS_ORIGIN = 'http://localhost:3000'
process.env.PORT = '5001'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Setup test database connection
jest.mock('../config/database.js', () => ({
  default: {
    query: jest.fn(),
    getConnection: jest.fn(() => ({
      query: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    }))
  }
}))

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    role: 'student',
    is_active: true,
    ...overrides
  }),
  
  createMockStudent: (overrides = {}) => ({
    id: 1,
    user_id: 1,
    first_name: 'Test',
    last_name: 'Student',
    email: 'test@student.com',
    ...overrides
  }),
  
  createMockTeacher: (overrides = {}) => ({
    id: 1,
    user_id: 2,
    first_name: 'Test',
    last_name: 'Teacher',
    email: 'test@teacher.com',
    ...overrides
  })
}
