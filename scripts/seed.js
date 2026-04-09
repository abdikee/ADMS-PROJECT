#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcrypt'
import pool from '../backend/config/database.js'
import logger from '../backend/config/logger.js'

class DatabaseSeeder {
  constructor() {
    this.seedDataPath = path.join(process.cwd(), 'database', 'seed-data')
  }

  async seedAll() {
    try {
      logger.info('Starting database seeding...')
      
      await this.seedAcademicYears()
      await this.seedDepartments()
      await this.seedSubjects()
      await this.seedExamTypes()
      await this.seedAdminUser()
      await this.seedSampleData()
      
      logger.info('Database seeding completed successfully')
      
    } catch (error) {
      logger.error('Database seeding failed', { error: error.message })
      throw error
    }
  }

  async seedAcademicYears() {
    try {
      const academicYears = [
        {
          year: '2023-2024',
          semester: '1',
          start_date: '2023-09-01',
          end_date: '2024-01-31',
          is_active: true
        },
        {
          year: '2023-2024',
          semester: '2',
          start_date: '2024-02-01',
          end_date: '2024-06-30',
          is_active: false
        },
        {
          year: '2024-2025',
          semester: '1',
          start_date: '2024-09-01',
          end_date: '2025-01-31',
          is_active: false
        }
      ]

      for (const year of academicYears) {
        await pool.query(`
          INSERT INTO academic_years (year, semester, start_date, end_date, is_active)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (year, semester) DO NOTHING
        `, [year.year, year.semester, year.start_date, year.end_date, year.is_active])
      }

      logger.info('Academic years seeded')
    } catch (error) {
      logger.error('Failed to seed academic years', { error: error.message })
      throw error
    }
  }

  async seedDepartments() {
    try {
      const departments = [
        { name: 'Mathematics', code: 'MATH', description: 'Mathematics Department' },
        { name: 'Science', code: 'SCI', description: 'Science Department' },
        { name: 'Languages', code: 'LANG', description: 'Languages Department' },
        { name: 'Social Studies', code: 'SS', description: 'Social Studies Department' },
        { name: 'Arts', code: 'ARTS', description: 'Arts Department' },
        { name: 'Computer Science', code: 'CS', description: 'Computer Science Department' },
        { name: 'Physical Education', code: 'PE', description: 'Physical Education Department' }
      ]

      for (const dept of departments) {
        await pool.query(`
          INSERT INTO departments (name, code, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (code) DO NOTHING
        `, [dept.name, dept.code, dept.description])
      }

      logger.info('Departments seeded')
    } catch (error) {
      logger.error('Failed to seed departments', { error: error.message })
      throw error
    }
  }

  async seedSubjects() {
    try {
      const subjects = [
        { name: 'Mathematics', code: 'MATH101', department_code: 'MATH', max_marks: 100, passing_marks: 40 },
        { name: 'Advanced Mathematics', code: 'MATH201', department_code: 'MATH', max_marks: 100, passing_marks: 40 },
        { name: 'Physics', code: 'PHYS101', department_code: 'SCI', max_marks: 100, passing_marks: 40 },
        { name: 'Chemistry', code: 'CHEM101', department_code: 'SCI', max_marks: 100, passing_marks: 40 },
        { name: 'Biology', code: 'BIO101', department_code: 'SCI', max_marks: 100, passing_marks: 40 },
        { name: 'English', code: 'ENG101', department_code: 'LANG', max_marks: 100, passing_marks: 40 },
        { name: 'History', code: 'HIST101', department_code: 'SS', max_marks: 100, passing_marks: 40 },
        { name: 'Geography', code: 'GEOG101', department_code: 'SS', max_marks: 100, passing_marks: 40 },
        { name: 'Art', code: 'ART101', department_code: 'ARTS', max_marks: 100, passing_marks: 40 },
        { name: 'Music', code: 'MUS101', department_code: 'ARTS', max_marks: 100, passing_marks: 40 },
        { name: 'Computer Science', code: 'CS101', department_code: 'CS', max_marks: 100, passing_marks: 40 },
        { name: 'Physical Education', code: 'PE101', department_code: 'PE', max_marks: 100, passing_marks: 40 }
      ]

      for (const subject of subjects) {
        // Get department ID
        const [deptResult] = await pool.query(
          'SELECT id FROM departments WHERE code = $1',
          [subject.department_code]
        )

        if (deptResult.length > 0) {
          await pool.query(`
            INSERT INTO subjects (name, code, description, max_marks, passing_marks, department_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (code) DO NOTHING
          `, [
            subject.name,
            subject.code,
            `${subject.name} - ${subject.description}`,
            subject.max_marks,
            subject.passing_marks,
            deptResult[0].id
          ])
        }
      }

      logger.info('Subjects seeded')
    } catch (error) {
      logger.error('Failed to seed subjects', { error: error.message })
      throw error
    }
  }

  async seedExamTypes() {
    try {
      const examTypes = [
        { name: 'Midterm Exam', code: 'MIDTERM', weightage: 30.00 },
        { name: 'Final Exam', code: 'FINAL', weightage: 50.00 },
        { name: 'Quiz', code: 'QUIZ', weightage: 10.00 },
        { name: 'Assignment', code: 'ASSIGNMENT', weightage: 10.00 },
        { name: 'Practical Exam', code: 'PRACTICAL', weightage: 20.00 },
        { name: 'Project', code: 'PROJECT', weightage: 15.00 }
      ]

      for (const examType of examTypes) {
        await pool.query(`
          INSERT INTO exam_types (name, code, description, weightage)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (code) DO NOTHING
        `, [
          examType.name,
          examType.code,
          `${examType.name} - ${examType.weightage}% weightage`,
          examType.weightage
        ])
      }

      logger.info('Exam types seeded')
    } catch (error) {
      logger.error('Failed to seed exam types', { error: error.message })
      throw error
    }
  }

  async seedAdminUser() {
    try {
      const adminUsername = 'admin'
      const adminPassword = 'admin123456' // Change this in production
      
      // Check if admin user already exists
      const [existingAdmin] = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [adminUsername]
      )

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12)
        
        const [userResult] = await pool.query(`
          INSERT INTO users (username, password, role, is_active)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [adminUsername, hashedPassword, 'admin', true])

        logger.info('Admin user created', { username: adminUsername })
      } else {
        logger.info('Admin user already exists')
      }
    } catch (error) {
      logger.error('Failed to seed admin user', { error: error.message })
      throw error
    }
  }

  async seedSampleData() {
    try {
      // Create sample classes
      await this.seedClasses()
      
      // Create sample teachers
      await this.seedTeachers()
      
      // Create sample students
      await this.seedStudents()
      
      // Create sample assignments
      await this.seedTeacherAssignments()
      
      logger.info('Sample data seeded')
    } catch (error) {
      logger.error('Failed to seed sample data', { error: error.message })
      throw error
    }
  }

  async seedClasses() {
    try {
      const classes = [
        { name: 'Grade 10A', grade: '10', section: 'A', max_students: 40 },
        { name: 'Grade 10B', grade: '10', section: 'B', max_students: 40 },
        { name: 'Grade 11A', grade: '11', section: 'A', max_students: 35 },
        { name: 'Grade 11B', grade: '11', section: 'B', max_students: 35 },
        { name: 'Grade 12A', grade: '12', section: 'A', max_students: 30 }
      ]

      for (const classData of classes) {
        await pool.query(`
          INSERT INTO classes (name, grade, section, max_students, academic_year_id)
          VALUES ($1, $2, $3, $4, (SELECT id FROM academic_years WHERE is_active = TRUE LIMIT 1))
          ON CONFLICT DO NOTHING
        `, [classData.name, classData.grade, classData.section, classData.max_students])
      }

      logger.info('Classes seeded')
    } catch (error) {
      logger.error('Failed to seed classes', { error: error.message })
      throw error
    }
  }

  async seedTeachers() {
    try {
      const teachers = [
        {
          username: 'teacher1',
          password: 'teacher123',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@school.edu',
          department_code: 'MATH'
        },
        {
          username: 'teacher2',
          password: 'teacher123',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@school.edu',
          department_code: 'SCI'
        },
        {
          username: 'teacher3',
          password: 'teacher123',
          firstName: 'Robert',
          lastName: 'Johnson',
          email: 'robert.johnson@school.edu',
          department_code: 'LANG'
        }
      ]

      for (const teacherData of teachers) {
        // Check if user already exists
        const [existingUser] = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [teacherData.username]
        )

        if (existingUser.length === 0) {
          const hashedPassword = await bcrypt.hash(teacherData.password, 10)
          
          // Create user
          const [userResult] = await pool.query(`
            INSERT INTO users (username, password, role, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [teacherData.username, hashedPassword, 'teacher', true])

          // Get department ID
          const [deptResult] = await pool.query(
            'SELECT id FROM departments WHERE code = $1',
            [teacherData.department_code]
          )

          if (deptResult.length > 0) {
            // Create teacher record
            await pool.query(`
              INSERT INTO teachers (user_id, first_name, last_name, email, department_id)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (user_id) DO NOTHING
            `, [
              userResult[0].id,
              teacherData.firstName,
              teacherData.lastName,
              teacherData.email,
              deptResult[0].id
            ])
          }
        }
      }

      logger.info('Teachers seeded')
    } catch (error) {
      logger.error('Failed to seed teachers', { error: error.message })
      throw error
    }
  }

  async seedStudents() {
    try {
      const students = [
        {
          username: 'student1',
          password: 'student123',
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice.williams@school.edu',
          class_name: 'Grade 10A'
        },
        {
          username: 'student2',
          password: 'student123',
          firstName: 'Bob',
          lastName: 'Brown',
          email: 'bob.brown@school.edu',
          class_name: 'Grade 10A'
        },
        {
          username: 'student3',
          password: 'student123',
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol.davis@school.edu',
          class_name: 'Grade 10B'
        },
        {
          username: 'student4',
          password: 'student123',
          firstName: 'David',
          lastName: 'Miller',
          email: 'david.miller@school.edu',
          class_name: 'Grade 11A'
        },
        {
          username: 'student5',
          password: 'student123',
          firstName: 'Eva',
          lastName: 'Wilson',
          email: 'eva.wilson@school.edu',
          class_name: 'Grade 11B'
        }
      ]

      for (const studentData of students) {
        // Check if user already exists
        const [existingUser] = await pool.query(
          'SELECT id FROM users WHERE username = $1',
          [studentData.username]
        )

        if (existingUser.length === 0) {
          const hashedPassword = await bcrypt.hash(studentData.password, 10)
          
          // Create user
          const [userResult] = await pool.query(`
            INSERT INTO users (username, password, role, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [studentData.username, hashedPassword, 'student', true])

          // Get class ID
          const [classResult] = await pool.query(
            'SELECT id FROM classes WHERE name = $1',
            [studentData.class_name]
          )

          if (classResult.length > 0) {
            // Create student record
            await pool.query(`
              INSERT INTO students (user_id, first_name, last_name, email, class_id, admission_number)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (user_id) DO NOTHING
            `, [
              userResult[0].id,
              studentData.firstName,
              studentData.lastName,
              studentData.email,
              classResult[0].id,
              `ADM${String(userResult[0].id).padStart(6, '0')}`
            ])
          }
        }
      }

      logger.info('Students seeded')
    } catch (error) {
      logger.error('Failed to seed students', { error: error.message })
      throw error
    }
  }

  async seedTeacherAssignments() {
    try {
      // Get teachers, subjects, and classes
      const [teachers] = await pool.query(`
        SELECT t.id, t.first_name, t.last_name, d.code as dept_code
        FROM teachers t
        JOIN departments d ON t.department_id = d.id
        JOIN users u ON t.user_id = u.id
        WHERE u.username LIKE 'teacher%'
      `)

      const [subjects] = await pool.query('SELECT id, code FROM subjects')
      const [classes] = await pool.query('SELECT id, name FROM classes')
      const [academicYear] = await pool.query('SELECT id FROM academic_years WHERE is_active = TRUE LIMIT 1')

      for (const teacher of teachers) {
        // Assign subjects based on department
        const teacherSubjects = subjects.filter(s => {
          if (teacher.dept_code === 'MATH') return s.code.includes('MATH')
          if (teacher.dept_code === 'SCI') return s.code.includes('PHYS') || s.code.includes('CHEM') || s.code.includes('BIO')
          if (teacher.dept_code === 'LANG') return s.code.includes('ENG')
          return false
        })

        // Assign to multiple classes
        for (const subject of teacherSubjects.slice(0, 2)) { // Max 2 subjects per teacher
          for (const cls of classes.slice(0, 2)) { // Max 2 classes per teacher
            await pool.query(`
              INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, academic_year_id)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (teacher_id, subject_id, class_id, academic_year_id) DO NOTHING
            `, [teacher.id, subject.id, cls.id, academicYear[0].id])
          }
        }
      }

      logger.info('Teacher assignments seeded')
    } catch (error) {
      logger.error('Failed to seed teacher assignments', { error: error.message })
      throw error
    }
  }

  async clearAll() {
    try {
      logger.warn('Clearing all seed data...')
      
      // Clear in order of dependencies
      await pool.query('DELETE FROM teacher_subjects')
      await pool.query('DELETE FROM marks')
      await pool.query('DELETE FROM attendance')
      await pool.query('DELETE FROM students')
      await pool.query('DELETE FROM teachers')
      await pool.query('DELETE FROM classes')
      await pool.query('DELETE FROM subjects')
      await pool.query('DELETE FROM exam_types')
      await pool.query('DELETE FROM departments')
      await pool.query('DELETE FROM academic_years')
      
      // Keep admin user and migrations table
      
      logger.info('All seed data cleared')
    } catch (error) {
      logger.error('Failed to clear seed data', { error: error.message })
      throw error
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const seeder = new DatabaseSeeder()
  
  try {
    switch (command) {
      case 'all':
        await seeder.seedAll()
        break
      case 'clear':
        await seeder.clearAll()
        break
      case 'academic-years':
        await seeder.seedAcademicYears()
        break
      case 'departments':
        await seeder.seedDepartments()
        break
      case 'subjects':
        await seeder.seedSubjects()
        break
      case 'exam-types':
        await seeder.seedExamTypes()
        break
      case 'admin':
        await seeder.seedAdminUser()
        break
      case 'sample':
        await seeder.seedSampleData()
        break
      default:
        console.log('Usage: node seed.js [all|clear|academic-years|departments|subjects|exam-types|admin|sample]')
        console.log('  all              - Seed all data')
        console.log('  clear            - Clear all seed data')
        console.log('  academic-years   - Seed academic years')
        console.log('  departments      - Seed departments')
        console.log('  subjects         - Seed subjects')
        console.log('  exam-types       - Seed exam types')
        console.log('  admin            - Seed admin user')
        console.log('  sample           - Seed sample data')
    }
  } catch (error) {
    logger.error('Seeding command failed', { error: error.message })
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default DatabaseSeeder
