import pool from '../config/database.js'
import logger from '../config/logger.js'
import { cache } from '../config/redis.js'

class GDPRController {
  // Data Portability - Export user data
  async exportUserData(req, res) {
    try {
      const userId = req.user.id
      const userRole = req.user.role
      
      logger.info('Data export requested', { userId, userRole })
      
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      
      try {
        const userData = {}
        
        // Get basic user information
        const [users] = await connection.query(
          'SELECT id, username, role, created_at, last_login FROM users WHERE id = $1',
          [userId]
        )
        
        if (users.length === 0) {
          await connection.rollback()
          return res.status(404).json({ error: 'User not found' })
        }
        
        userData.user = users[0]
        
        // Get role-specific data
        if (userRole === 'student') {
          const [students] = await connection.query(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, gender,
             blood_group, address, parent_guardian_name, parent_guardian_phone,
             parent_guardian_email, admission_number, admission_date, created_at, updated_at
             FROM students WHERE user_id = $1`,
            [userId]
          )
          
          if (students.length > 0) {
            userData.student = students[0]
            
            // Get academic records
            const [marks] = await connection.query(
              `SELECT m.*, sub.name as subject_name, et.name as exam_type, c.name as class_name
               FROM marks m
               JOIN subjects sub ON m.subject_id = sub.id
               JOIN exam_types et ON m.exam_type_id = et.id
               JOIN classes c ON m.class_id = c.id
               WHERE m.student_id = $1
               ORDER BY m.created_at DESC`,
              [students[0].id]
            )
            userData.academic_records = marks
            
            // Get attendance records
            const [attendance] = await connection.query(
              `SELECT a.*, c.name as class_name
               FROM attendance a
               JOIN classes c ON a.class_id = c.id
               WHERE a.student_id = $1
               ORDER BY a.date DESC`,
              [students[0].id]
            )
            userData.attendance_records = attendance
            
            // Get course registrations
            const [registrations] = await connection.query(
              `SELECT cr.*, sub.name as subject_name, c.name as class_name
               FROM course_registrations cr
               JOIN subjects sub ON cr.subject_id = sub.id
               JOIN classes c ON cr.class_id = c.id
               WHERE cr.student_id = $1
               ORDER BY cr.created_at DESC`,
              [students[0].id]
            )
            userData.course_registrations = registrations
          }
        } else if (userRole === 'teacher') {
          const [teachers] = await connection.query(
            `SELECT id, first_name, last_name, email, phone, date_of_birth, hire_date,
             qualification, department_id, address, emergency_contact, emergency_phone,
             created_at, updated_at
             FROM teachers WHERE user_id = $1`,
            [userId]
          )
          
          if (teachers.length > 0) {
            userData.teacher = teachers[0]
            
            // Get teaching assignments
            const [assignments] = await connection.query(
              `SELECT ts.*, sub.name as subject_name, c.name as class_name
               FROM teacher_subjects ts
               JOIN subjects sub ON ts.subject_id = sub.id
               JOIN classes c ON ts.class_id = c.id
               WHERE ts.teacher_id = $1
               ORDER BY ts.created_at DESC`,
              [teachers[0].id]
            )
            userData.teaching_assignments = assignments
          }
        }
        
        // Get login attempts (security data)
        const [loginAttempts] = await connection.query(
          'SELECT ip_address, attempt_time, success FROM login_attempts WHERE username = $1 ORDER BY attempt_time DESC LIMIT 100',
          [req.user.username]
        )
        userData.login_attempts = loginAttempts
        
        // Get activity logs
        const [activityLogs] = await connection.query(
          'SELECT action, entity_type, description, ip_address, created_at FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
          [userId]
        )
        userData.activity_logs = activityLogs
        
        await connection.commit()
        
        // Log data export
        logger.security('User data exported', { 
          userId, 
          userRole, 
          exportSize: JSON.stringify(userData).length,
          ip: req.ip 
        })
        
        res.json({
          message: 'Data export completed',
          exported_at: new Date().toISOString(),
          data: userData
        })
        
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Data export failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Data export failed' })
    }
  }

  // Right to be Forgotten - Delete user data
  async deleteUserData(req, res) {
    try {
      const userId = req.user.id
      const userRole = req.user.role
      const confirmation = req.body.confirmation
      
      if (!confirmation || confirmation !== 'DELETE_MY_DATA') {
        return res.status(400).json({ 
          error: 'Confirmation required. Please send "DELETE_MY_DATA" to confirm data deletion.' 
        })
      }
      
      logger.security('Data deletion requested', { userId, userRole, ip: req.ip })
      
      const connection = await pool.getConnection()
      await connection.beginTransaction()
      
      try {
        // Get user info for logging
        const [users] = await connection.query(
          'SELECT username, role FROM users WHERE id = $1',
          [userId]
        )
        
        if (users.length === 0) {
          await connection.rollback()
          return res.status(404).json({ error: 'User not found' })
        }
        
        const userInfo = users[0]
        
        // Delete role-specific data
        if (userRole === 'student') {
          const [students] = await connection.query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
          )
          
          if (students.length > 0) {
            const studentId = students[0].id
            
            // Delete student-related data in order of dependencies
            await connection.query('DELETE FROM assignment_submissions WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM course_registrations WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM attendance WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM marks WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM book_issues WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM fee_payments WHERE student_id = $1', [studentId])
            await connection.query('DELETE FROM students WHERE id = $1', [studentId])
          }
        } else if (userRole === 'teacher') {
          const [teachers] = await connection.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [userId]
          )
          
          if (teachers.length > 0) {
            const teacherId = teachers[0].id
            
            // Delete teacher-related data
            await connection.query('DELETE FROM teacher_subjects WHERE teacher_id = $1', [teacherId])
            await connection.query('DELETE FROM classes WHERE homeroom_teacher_id = $1', [teacherId])
            await connection.query('DELETE FROM teachers WHERE id = $1', [teacherId])
          }
        }
        
        // Delete user-related data
        await connection.query('DELETE FROM activity_log WHERE user_id = $1', [userId])
        await connection.query('DELETE FROM login_attempts WHERE username = $1', [userInfo.username])
        await connection.query('DELETE FROM users WHERE id = $1', [userId])
        
        await connection.commit()
        
        // Clear cache
        await cache.invalidateUser(userId)
        
        // Log data deletion
        logger.security('User data deleted', { 
          userId, 
          username: userInfo.username, 
          userRole, 
          ip: req.ip 
        })
        
        res.json({
          message: 'All your data has been permanently deleted as per GDPR requirements',
          deleted_at: new Date().toISOString()
        })
        
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Data deletion failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Data deletion failed' })
    }
  }

  // Data Access - Show what data is stored
  async getUserDataSummary(req, res) {
    try {
      const userId = req.user.id
      const userRole = req.user.role
      
      const connection = await pool.getConnection()
      
      try {
        const dataSummary = {
          user_id: userId,
          role: userRole,
          data_categories: {}
        }
        
        // Count different types of data
        const [userCount] = await connection.query(
          'SELECT COUNT(*) as count FROM users WHERE id = $1',
          [userId]
        )
        dataSummary.data_categories.basic_info = userCount[0].count
        
        if (userRole === 'student') {
          const [students] = await connection.query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
          )
          
          if (students.length > 0) {
            const studentId = students[0].id
            
            const [marksCount] = await connection.query(
              'SELECT COUNT(*) as count FROM marks WHERE student_id = $1',
              [studentId]
            )
            dataSummary.data_categories.academic_records = marksCount[0].count
            
            const [attendanceCount] = await connection.query(
              'SELECT COUNT(*) as count FROM attendance WHERE student_id = $1',
              [studentId]
            )
            dataSummary.data_categories.attendance_records = attendanceCount[0].count
            
            const [loginAttemptsCount] = await connection.query(
              'SELECT COUNT(*) as count FROM login_attempts WHERE username = $1',
              [req.user.username]
            )
            dataSummary.data_categories.login_attempts = loginAttemptsCount[0].count
          }
        } else if (userRole === 'teacher') {
          const [teachers] = await connection.query(
            'SELECT id FROM teachers WHERE user_id = $1',
            [userId]
          )
          
          if (teachers.length > 0) {
            const teacherId = teachers[0].id
            
            const [assignmentsCount] = await connection.query(
              'SELECT COUNT(*) as count FROM teacher_subjects WHERE teacher_id = $1',
              [teacherId]
            )
            dataSummary.data_categories.teaching_assignments = assignmentsCount[0].count
          }
        }
        
        const [activityLogsCount] = await connection.query(
          'SELECT COUNT(*) as count FROM activity_log WHERE user_id = $1',
          [userId]
        )
        dataSummary.data_categories.activity_logs = activityLogsCount[0].count
        
        res.json({
          message: 'Data summary retrieved successfully',
          summary: dataSummary,
          last_updated: new Date().toISOString()
        })
        
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Data summary retrieval failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Failed to retrieve data summary' })
    }
  }

  // Consent Management
  async updateConsent(req, res) {
    try {
      const userId = req.user.id
      const { marketing_consent, analytics_consent, data_processing_consent } = req.body
      
      const connection = await pool.getConnection()
      
      try {
        // Create or update consent record
        await connection.query(`
          INSERT INTO user_consents (user_id, marketing_consent, analytics_consent, data_processing_consent, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id) 
          DO UPDATE SET 
            marketing_consent = $2,
            analytics_consent = $3,
            data_processing_consent = $4,
            updated_at = NOW()
        `, [userId, marketing_consent, analytics_consent, data_processing_consent])
        
        logger.security('User consent updated', { 
          userId, 
          marketing_consent, 
          analytics_consent, 
          data_processing_consent,
          ip: req.ip 
        })
        
        res.json({
          message: 'Consent preferences updated successfully',
          updated_at: new Date().toISOString()
        })
        
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Consent update failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Failed to update consent preferences' })
    }
  }

  // Get current consent settings
  async getConsent(req, res) {
    try {
      const userId = req.user.id
      
      const connection = await pool.getConnection()
      
      try {
        const [consents] = await connection.query(
          'SELECT marketing_consent, analytics_consent, data_processing_consent, updated_at FROM user_consents WHERE user_id = $1',
          [userId]
        )
        
        if (consents.length === 0) {
          // Return default consent values
          return res.json({
            marketing_consent: false,
            analytics_consent: true,
            data_processing_consent: true,
            updated_at: null
          })
        }
        
        res.json(consents[0])
        
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Consent retrieval failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Failed to retrieve consent preferences' })
    }
  }

  // Data Processing Records
  async getDataProcessingRecords(req, res) {
    try {
      const userId = req.user.id
      
      const connection = await pool.getConnection()
      
      try {
        const [records] = await connection.query(`
          SELECT action, entity_type, description, ip_address, created_at
          FROM activity_log 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 50
        `, [userId])
        
        res.json({
          message: 'Data processing records retrieved successfully',
          records: records,
          total_count: records.length
        })
        
      } finally {
        connection.release()
      }
      
    } catch (error) {
      logger.error('Data processing records retrieval failed', { error: error.message, userId: req.user.id })
      res.status(500).json({ error: 'Failed to retrieve data processing records' })
    }
  }
}

export default new GDPRController()
