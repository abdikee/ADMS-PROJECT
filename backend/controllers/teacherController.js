import pool from '../config/database.js';
import bcrypt from 'bcrypt';

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAssignedClassIds(payload) {
  const rawClassIds = Array.isArray(payload.assignedClassIds)
    ? payload.assignedClassIds
    : payload.assignedClassId !== undefined && payload.assignedClassId !== null
      ? [payload.assignedClassId]
      : [];

  return [...new Set(
    rawClassIds
      .map((classId) => Number(classId))
      .filter((classId) => Number.isInteger(classId) && classId > 0)
  )];
}

async function ensureDepartmentExists(connection, departmentId) {
  if (!departmentId) {
    return null;
  }

  const normalizedDepartmentId = Number(departmentId);
  if (!Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0) {
    throw createHttpError('Select a valid department');
  }

  const [departments] = await connection.query(
    'SELECT id FROM departments WHERE id = ? LIMIT 1',
    [normalizedDepartmentId]
  );

  if (departments.length === 0) {
    throw createHttpError('Selected department was not found');
  }

  return normalizedDepartmentId;
}

async function ensureSubjectExists(connection, subjectId) {
  const normalizedSubjectId = Number(subjectId);
  if (!Number.isInteger(normalizedSubjectId) || normalizedSubjectId <= 0) {
    throw createHttpError('Select a valid subject');
  }

  const [subjects] = await connection.query(
    'SELECT id FROM subjects WHERE id = ? AND is_active = TRUE LIMIT 1',
    [normalizedSubjectId]
  );

  if (subjects.length === 0) {
    throw createHttpError('Selected subject was not found');
  }

  return normalizedSubjectId;
}

async function ensureUsernameAvailable(connection, username) {
  const normalizedUsername = String(username || '').trim();
  if (!normalizedUsername) {
    throw createHttpError('Username is required');
  }

  const [existingUsers] = await connection.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [normalizedUsername]
  );

  if (existingUsers.length > 0) {
    throw createHttpError('Username already exists');
  }

  return normalizedUsername;
}

async function clearHomeroomAssignments(connection, teacherId) {
  await connection.query(
    'UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = ?',
    [teacherId]
  );
}

async function syncTeacherAssignments(connection, teacherId, subjectId, assignedClassIds, homeroomClassId) {
  await connection.query(
    'DELETE FROM teacher_subjects WHERE teacher_id = ?',
    [teacherId]
  );

  if (subjectId && assignedClassIds.length > 0) {
    const [classes] = await connection.query(
      'SELECT id, academic_year_id FROM classes WHERE id IN (?)',
      [assignedClassIds]
    );

    if (classes.length !== assignedClassIds.length) {
      throw createHttpError('One or more assigned classes were not found');
    }

    for (const classItem of classes) {
      await connection.query(
        `INSERT INTO teacher_subjects (teacher_id, subject_id, class_id, academic_year_id)
         VALUES (?, ?, ?, ?)`,
        [teacherId, subjectId, classItem.id, classItem.academic_year_id || null]
      );
    }
  }

  await clearHomeroomAssignments(connection, teacherId);

  if (homeroomClassId) {
    await connection.query(
      'UPDATE classes SET homeroom_teacher_id = ? WHERE id = ?',
      [teacherId, homeroomClassId]
    );
  }
}

const teacherSelect = `
  SELECT
    t.id,
    t.department_id,
    t.first_name,
    t.last_name,
    t.email,
    t.phone,
    t.qualification,
    t.hire_date,
    d.name AS department_name,
    u.username,
    t.is_active,
    MAX(ts.subject_id) AS subject_id,
    MAX(sub.name) AS subject_name,
    GROUP_CONCAT(DISTINCT ts.class_id ORDER BY cls.name SEPARATOR ',') AS assigned_class_ids,
    GROUP_CONCAT(DISTINCT cls.name ORDER BY cls.name SEPARATOR '||') AS assigned_class_names,
    MIN(ts.class_id) AS assigned_class_id,
    MIN(cls.name) AS assigned_class_name,
    MAX(home.id) AS homeroom_class_id,
    MAX(home.name) AS homeroom_class_name
  FROM teachers t
  LEFT JOIN departments d ON t.department_id = d.id
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
  LEFT JOIN subjects sub ON ts.subject_id = sub.id
  LEFT JOIN classes cls ON ts.class_id = cls.id
  LEFT JOIN classes home ON home.homeroom_teacher_id = t.id
`;

export const getAllTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.query(`
      ${teacherSelect}
      WHERE t.is_active = TRUE
      GROUP BY
        t.id, t.department_id, t.first_name, t.last_name, t.email, t.phone,
        t.qualification, t.hire_date, d.name, u.username, t.is_active
      ORDER BY t.first_name, t.last_name
    `);

    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const [teachers] = await pool.query(`
      ${teacherSelect}
      WHERE t.id = ?
      GROUP BY
        t.id, t.department_id, t.first_name, t.last_name, t.email, t.phone,
        t.qualification, t.hire_date, d.name, u.username, t.is_active
    `, [id]);

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teachers[0]);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
};

export const createTeacher = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      qualification,
      hireDate,
      username,
      password,
      subjectId,
      homeroomClassId
    } = req.body;

    const assignedClassIds = normalizeAssignedClassIds(req.body);

    if (!username || !password) {
      throw createHttpError('Username and password are required');
    }

    if (!subjectId) {
      throw createHttpError('A teacher must be assigned exactly one subject');
    }

    if (assignedClassIds.length === 0) {
      throw createHttpError('A teacher must be assigned to at least one class');
    }

    if (homeroomClassId && !assignedClassIds.includes(Number(homeroomClassId))) {
      throw createHttpError('Homeroom class must also be one of the assigned teaching classes');
    }

    const normalizedDepartmentId = await ensureDepartmentExists(connection, departmentId);
    const normalizedSubjectId = await ensureSubjectExists(connection, subjectId);
    const normalizedUsername = await ensureUsernameAvailable(connection, username);

    await connection.beginTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [normalizedUsername, hashedPassword, 'teacher']
    );

    const userId = userResult.insertId;

    const [teacherResult] = await connection.query(
      `INSERT INTO teachers
       (user_id, first_name, last_name, email, phone, department_id, qualification, hire_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, firstName, lastName, email, phone, normalizedDepartmentId, qualification || null, hireDate || null]
    );

    const teacherId = teacherResult.insertId;

    await syncTeacherAssignments(
      connection,
      teacherId,
      normalizedSubjectId,
      assignedClassIds,
      homeroomClassId ? Number(homeroomClassId) : null
    );

    await connection.commit();

    res.status(201).json({
      message: 'Teacher created successfully',
      teacherId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating teacher:', error);
    const statusCode = error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 400 : 500);
    const message = error.statusCode
      ? error.message
      : error.code === 'ER_DUP_ENTRY'
        ? 'Username already exists'
        : error.message || 'Failed to create teacher';
    res.status(statusCode).json({ error: message });
  } finally {
    connection.release();
  }
};

export const updateTeacher = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const updates = req.body;
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      departmentId: 'department_id',
      qualification: 'qualification',
      hireDate: 'hire_date',
    };

    const fields = [];
    const values = [];

    let normalizedDepartmentId;
    if (updates.departmentId !== undefined) {
      normalizedDepartmentId = await ensureDepartmentExists(connection, updates.departmentId);
    }

    Object.entries(fieldMap).forEach(([key, dbField]) => {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        if (key === 'departmentId') {
          values.push(normalizedDepartmentId);
        } else {
          values.push(updates[key] || null);
        }
      }
    });

    if (fields.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE teachers SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    if (
      updates.subjectId !== undefined ||
      updates.assignedClassId !== undefined ||
      updates.assignedClassIds !== undefined ||
      updates.homeroomClassId !== undefined
    ) {
      const [existingAssignments] = await connection.query(
        'SELECT subject_id, class_id FROM teacher_subjects WHERE teacher_id = ? ORDER BY class_id',
        [id]
      );
      const [existingHomeroom] = await connection.query(
        'SELECT id FROM classes WHERE homeroom_teacher_id = ? LIMIT 1',
        [id]
      );

      const subjectId = updates.subjectId ?? existingAssignments[0]?.subject_id;
      const assignedClassIds = updates.assignedClassIds !== undefined || updates.assignedClassId !== undefined
        ? normalizeAssignedClassIds(updates)
        : existingAssignments.map((assignment) => Number(assignment.class_id));
      const homeroomClassId = updates.homeroomClassId ?? existingHomeroom[0]?.id ?? null;

      if (!subjectId || assignedClassIds.length === 0) {
        throw createHttpError('Teacher assignment requires one subject and at least one class');
      }

      if (homeroomClassId && !assignedClassIds.includes(Number(homeroomClassId))) {
        throw createHttpError('Homeroom class must also be one of the assigned teaching classes');
      }

      const normalizedSubjectId = await ensureSubjectExists(connection, subjectId);

      await syncTeacherAssignments(
        connection,
        Number(id),
        normalizedSubjectId,
        assignedClassIds,
        homeroomClassId ? Number(homeroomClassId) : null
      );
    }

    await connection.commit();

    res.json({ message: 'Teacher updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating teacher:', error);
    res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update teacher' });
  } finally {
    connection.release();
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE teachers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
};

export const generateCredentials = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { regenerate } = req.body;

    const [teachers] = await connection.query(
      `SELECT t.user_id, t.first_name, t.last_name, u.username
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = teachers[0];
    const hasRealCredentials = teacher.username && !teacher.username.startsWith('temp_');

    if (hasRealCredentials && !regenerate) {
      return res.status(400).json({
        error: 'Credentials already exist. Use regenerate option to create new credentials.',
        hasCredentials: true
      });
    }

    const firstName = teacher.first_name.toLowerCase().replace(/[^a-z]/g, '');
    const lastName = teacher.last_name.toLowerCase().replace(/[^a-z]/g, '');
    const randomNum = Math.floor(Math.random() * 999);
    const username = `tch_${firstName}${lastName.charAt(0)}${randomNum}`;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      'UPDATE users SET username = ?, password = ? WHERE id = ?',
      [username, hashedPassword, teacher.user_id]
    );

    await connection.commit();

    res.json({
      username,
      password,
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
