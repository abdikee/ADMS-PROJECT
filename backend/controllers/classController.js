import pool from '../config/database.js';

function normalizeSemester(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (normalized === '1' || normalized === 'Spring') return '1';
  if (normalized === '2' || normalized === 'Fall') return '2';
  return null;
}

function buildAcademicYearDates(year, semester) {
  const match = String(year).trim().match(/^(\d{4})(?:\s*-\s*(\d{4}))?$/);
  if (!match) throw new Error('Academic year must be in YYYY-YYYY format');

  const startYear = Number(match[1]);
  const endYear = match[2] ? Number(match[2]) : startYear + 1;
  if (endYear !== startYear + 1) throw new Error('Academic year must span consecutive years, for example 2025-2026');

  if (semester === '1') return { startDate: `${startYear}-01-01`, endDate: `${startYear}-06-30` };
  return { startDate: `${startYear}-07-01`, endDate: `${startYear}-12-31` };
}

async function resolveAcademicYearId(connection, payload) {
  const rawAcademicYearId = payload.academicYearId;
  if (rawAcademicYearId !== undefined && rawAcademicYearId !== null && rawAcademicYearId !== '') {
    const academicYearId = Number(rawAcademicYearId);
    const [existingAcademicYears] = await connection.query(
      'SELECT id FROM academic_years WHERE id = $1 LIMIT 1',
      [academicYearId]
    );
    if (existingAcademicYears.length === 0) throw new Error('Selected academic year was not found');
    return academicYearId;
  }

  const academicYear = String(payload.academicYear || '').trim();
  const semester = normalizeSemester(payload.semester);
  if (!academicYear || !semester) throw new Error('Academic year and semester are required');

  const [existingAcademicYears] = await connection.query(
    'SELECT id FROM academic_years WHERE year = $1 AND semester = $2 LIMIT 1',
    [academicYear, semester]
  );
  if (existingAcademicYears.length > 0) return existingAcademicYears[0].id;

  const { startDate, endDate } = buildAcademicYearDates(academicYear, semester);
  const [insertResult] = await connection.query(
    `INSERT INTO academic_years (year, semester, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4, FALSE) RETURNING id`,
    [academicYear, semester, startDate, endDate]
  );
  return insertResult[0].id;
}

function buildClassAccessFilters(req, classAlias = 'c') {
  const filters = [];
  const params = [];

  if (req.user.role === 'teacher' && req.user.teacherId) {
    const i = params.length + 1;
    filters.push(
      `EXISTS (SELECT 1 FROM teacher_subjects ts WHERE ts.teacher_id = $${i} AND ts.class_id = ${classAlias}.id)`
    );
    params.push(req.user.teacherId);
  }

  if (req.user.role === 'student' && req.user.studentId) {
    const i = params.length + 1;
    filters.push(
      `EXISTS (SELECT 1 FROM students s WHERE s.id = $${i} AND s.class_id = ${classAlias}.id)`
    );
    params.push(req.user.studentId);
  }

  return { filters, params };
}

export const getAllClasses = async (req, res) => {
  try {
    const { filters, params } = buildClassAccessFilters(req);
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const [classes] = await pool.query(`
      SELECT c.*, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
             ay.year AS academic_year, ay.semester, COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = TRUE
      ${whereClause}
      GROUP BY c.id, t.first_name, t.last_name, ay.year, ay.semester
      ORDER BY c.grade, c.section
    `, params);

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const { filters, params } = buildClassAccessFilters(req);

    // prepend id filter with correct $N index
    const idParamIndex = params.length + 1;
    filters.unshift(`c.id = $${idParamIndex}`);
    params.push(id);

    const [classes] = await pool.query(`
      SELECT c.*, t.first_name AS teacher_first_name, t.last_name AS teacher_last_name,
             ay.year AS academic_year, ay.semester
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE ${filters.join(' AND ')}
    `, params);

    if (classes.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(classes[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
};

export const createClass = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { name, grade, section, homeroomTeacherId, maxStudents } = req.body;

    if (!name || /^\d+$/.test(String(name).trim())) {
      return res.status(400).json({ error: 'Class name cannot be a number only. Use a format like "Grade 10A"' });
    }

    const academicYearId = await resolveAcademicYearId(connection, req.body);

    const [result] = await connection.query(
      `INSERT INTO classes (name, grade, section, academic_year_id, homeroom_teacher_id, max_students)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, grade, section, academicYearId, homeroomTeacherId || null, maxStudents || 40]
    );

    res.status(201).json({ message: 'Class created successfully', classId: result[0].id });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(400).json({ error: error.message || 'Failed to create class' });
  } finally {
    connection.release();
  }
};

export const updateClass = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name !== undefined && /^\d+$/.test(String(updates.name).trim())) {
      return res.status(400).json({ error: 'Class name cannot be a number only. Use a format like "Grade 10A"' });
    }

    const fieldMap = {
      name: 'name', grade: 'grade', section: 'section',
      homeroomTeacherId: 'homeroom_teacher_id', maxStudents: 'max_students',
    };

    const fields = [];
    const values = [];
    let i = 1;

    Object.keys(fieldMap).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${fieldMap[key]} = $${i}`);
        values.push(updates[key]);
        i++;
      }
    });

    if (updates.academicYearId !== undefined || updates.academicYear !== undefined || updates.semester !== undefined) {
      const academicYearId = await resolveAcademicYearId(connection, updates);
      fields.push(`academic_year_id = $${i}`);
      values.push(academicYearId);
      i++;
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    await connection.query(`UPDATE classes SET ${fields.join(', ')} WHERE id = $${i}`, values);

    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(400).json({ error: error.message || 'Failed to update class' });
  } finally {
    connection.release();
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};
