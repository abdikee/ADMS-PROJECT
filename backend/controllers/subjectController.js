import pool from '../config/database.js';

async function validateDepartmentId(departmentId) {
  if (departmentId === undefined || departmentId === null || departmentId === '') {
    return null;
  }

  const normalizedDepartmentId = Number(departmentId);
  if (!Number.isInteger(normalizedDepartmentId) || normalizedDepartmentId <= 0) {
    return { error: 'Select a valid department' };
  }

  const [departments] = await pool.query(
    'SELECT id FROM departments WHERE id = ? LIMIT 1',
    [normalizedDepartmentId]
  );

  if (departments.length === 0) {
    return { error: 'Selected department was not found' };
  }

  return { value: normalizedDepartmentId };
}

export const getAllSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        s.max_marks,
        s.passing_marks,
        s.credit_hours,
        d.name as department_name,
        d.id as department_id,
        s.is_active
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.is_active = TRUE
      ORDER BY s.name
    `);

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const [subjects] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        s.max_marks,
        s.passing_marks,
        s.credit_hours,
        d.name as department_name,
        d.id as department_id,
        s.is_active
      FROM subjects s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.id = ?
    `, [id]);

    if (subjects.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    res.json(subjects[0]);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      maxMarks = 100,
      passingMarks = 40,
      departmentId,
      creditHours = 3
    } = req.body;

    const departmentResult = await validateDepartmentId(departmentId);
    if (departmentResult?.error) {
      return res.status(400).json({ error: departmentResult.error });
    }

    const [result] = await pool.query(
      `INSERT INTO subjects 
       (name, code, description, max_marks, passing_marks, department_id, credit_hours) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, code, description, maxMarks, passingMarks, departmentResult?.value ?? null, creditHours]
    );

    res.status(201).json({
      message: 'Subject created successfully',
      subjectId: result.insertId
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 400 : 500).json({
      error: error.code === 'ER_DUP_ENTRY' ? 'Subject code already exists' : 'Failed to create subject'
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      maxMarks,
      passingMarks,
      departmentId,
      creditHours
    } = req.body;

    const fields = [];
    const values = [];

    if (departmentId !== undefined) {
      const departmentResult = await validateDepartmentId(departmentId);
      if (departmentResult?.error) {
        return res.status(400).json({ error: departmentResult.error });
      }

      fields.push('department_id = ?');
      values.push(departmentResult?.value ?? null);
    }

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      values.push(code);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (maxMarks !== undefined) {
      fields.push('max_marks = ?');
      values.push(maxMarks);
    }
    if (passingMarks !== undefined) {
      fields.push('passing_marks = ?');
      values.push(passingMarks);
    }
    if (creditHours !== undefined) {
      fields.push('credit_hours = ?');
      values.push(creditHours);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Subject updated successfully' });

  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 400 : 500).json({
      error: error.code === 'ER_DUP_ENTRY' ? 'Subject code already exists' : 'Failed to update subject'
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete
    await pool.query(
      'UPDATE subjects SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Subject deleted successfully' });

  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};
