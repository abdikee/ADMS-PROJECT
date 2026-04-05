import pool from '../config/database.js';

function buildClassAccessFilters(req, classAlias = 'c') {
  const filters = [];
  const params = [];

  if (req.user.role === 'teacher' && req.user.teacherId) {
    filters.push(
      `EXISTS (
        SELECT 1
        FROM teacher_subjects ts
        WHERE ts.teacher_id = ?
          AND ts.class_id = ${classAlias}.id
      )`
    );
    params.push(req.user.teacherId);
  }

  if (req.user.role === 'student' && req.user.studentId) {
    filters.push(
      `EXISTS (
        SELECT 1
        FROM students s
        WHERE s.id = ?
          AND s.class_id = ${classAlias}.id
      )`
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
      SELECT
        c.*,
        t.first_name AS teacher_first_name,
        t.last_name AS teacher_last_name,
        ay.year AS academic_year,
        ay.semester,
        COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN students s ON s.class_id = c.id AND s.is_active = TRUE
      ${whereClause}
      GROUP BY
        c.id, t.first_name, t.last_name, ay.year, ay.semester
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

    filters.unshift('c.id = ?');
    params.unshift(id);

    const [classes] = await pool.query(`
      SELECT
        c.*,
        t.first_name AS teacher_first_name,
        t.last_name AS teacher_last_name,
        ay.year AS academic_year,
        ay.semester
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE ${filters.join(' AND ')}
    `, params);

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classes[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
};

export const createClass = async (req, res) => {
  try {
    const {
      name,
      grade,
      section,
      academicYearId,
      homeroomTeacherId,
      maxStudents
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO classes
       (name, grade, section, academic_year_id, homeroom_teacher_id, max_students)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, grade, section, academicYearId, homeroomTeacherId || null, maxStudents || 40]
    );

    res.status(201).json({
      message: 'Class created successfully',
      classId: result.insertId
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const fieldMap = {
      name: 'name',
      grade: 'grade',
      section: 'section',
      academicYearId: 'academic_year_id',
      homeroomTeacherId: 'homeroom_teacher_id',
      maxStudents: 'max_students',
    };

    const fields = [];
    const values = [];

    Object.keys(fieldMap).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${fieldMap[key]} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM classes WHERE id = ?', [id]);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};
