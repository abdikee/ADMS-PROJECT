import pool from '../config/database.js';
import bcrypt from 'bcrypt';

function applyStudentAccessFilters(req, filters, params, studentAlias = 's') {
  if (req.user.role === 'student' && req.user.studentId) {
    const i = params.length + 1;
    filters.push(`${studentAlias}.id = $${i}`);
    params.push(req.user.studentId);
  }

  if (req.user.role === 'teacher' && req.user.teacherId) {
    const i = params.length + 1;
    filters.push(
      `EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = $${i} AND ts.class_id = ${studentAlias}.class_id
      )`
    );
    params.push(req.user.teacherId);
  }
}

export const getAllStudents = async (req, res) => {
  try {
    const params = [];
    const filters = ['s.is_active = TRUE'];

    applyStudentAccessFilters(req, filters, params);

    const [students] = await pool.query(`
      SELECT
        s.id, s.class_id, s.first_name, s.last_name, s.email, s.phone,
        s.roll_number, s.admission_number, s.date_of_birth, s.gender,
        c.name AS class_name, c.grade, c.section, u.username, s.is_active
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE ${filters.join(' AND ')}
      ORDER BY c.grade, c.section, s.first_name, s.last_name
    `, params);

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const params = [id];
    const filters = ['s.id = $1'];

    applyStudentAccessFilters(req, filters, params);

    const [students] = await pool.query(`
      SELECT s.*, c.name AS class_name, c.grade, c.section, u.username
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE ${filters.join(' AND ')}
    `, params);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(students[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { firstName, lastName, email, phone, classId, dateOfBirth, gender, username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, 'student']
    );

    const userId = userResult[0].id;

    const [studentResult] = await connection.query(
      `INSERT INTO students
       (user_id, first_name, last_name, email, phone, class_id, roll_number, admission_number, date_of_birth, gender)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8) RETURNING id`,
      [userId, firstName, lastName, email, phone, classId, dateOfBirth, gender]
    );

    const studentId = studentResult[0].id;
    const generatedRollNumber = `R${String(studentId).padStart(6, '0')}`;
    const generatedAdmissionNumber = `ADM${studentId}`;

    await connection.query(
      'UPDATE students SET roll_number = $1, admission_number = $2 WHERE id = $3',
      [generatedRollNumber, generatedAdmissionNumber, studentId]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Student created successfully',
      studentId,
      rollNumber: generatedRollNumber,
      admissionNumber: generatedAdmissionNumber
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    connection.release();
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fieldMap = {
      firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
      classId: 'class_id', rollNumber: 'roll_number', admissionNumber: 'admission_number',
      dateOfBirth: 'date_of_birth', gender: 'gender',
    };

    const fields = [];
    const values = [];
    let i = 1;

    Object.keys(updates).forEach((key) => {
      const dbField = fieldMap[key];
      if (dbField && updates[key] !== undefined) {
        fields.push(`${dbField} = $${i}`);
        values.push(updates[key]);
        i++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE students SET ${fields.join(', ')} WHERE id = $${i}`, values);

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE students SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const generateCredentials = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { regenerate } = req.body;

    const [students] = await connection.query(
      `SELECT s.user_id, s.first_name, s.last_name, u.username
       FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];
    const hasRealCredentials = student.username && !student.username.startsWith('temp_');

    if (hasRealCredentials && !regenerate) {
      return res.status(400).json({
        error: 'Credentials already exist. Use regenerate option to create new credentials.',
        hasCredentials: true
      });
    }

    const firstName = student.first_name.toLowerCase().replace(/[^a-z]/g, '');
    const lastName = student.last_name.toLowerCase().replace(/[^a-z]/g, '');
    const randomNum = Math.floor(Math.random() * 999);
    const username = `stu_${firstName}${lastName.charAt(0)}${randomNum}`;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i += 1) password += chars.charAt(Math.floor(Math.random() * chars.length));

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'UPDATE users SET username = $1, password = $2 WHERE id = $3',
      [username, hashedPassword, student.user_id]
    );

    await connection.commit();

    res.json({
      username, password,
      message: regenerate ? 'Credentials regenerated successfully' : 'Credentials generated successfully',
      hasCredentials: true
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error generating credentials:', error);
    res.status(500).json({ error: 'Failed to generate credentials' });
  } finally {
    connection.release();
  }
};
