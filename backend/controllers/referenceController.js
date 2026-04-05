import pool from '../config/database.js';

export const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT id, name, code, description
      FROM departments
      ORDER BY name
    `);

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getExamTypes = async (req, res) => {
  try {
    const [examTypes] = await pool.query(`
      SELECT id, name, code, description, weightage, is_active
      FROM exam_types
      WHERE is_active = TRUE
      ORDER BY name
    `);

    res.json(examTypes);
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({ error: 'Failed to fetch exam types' });
  }
};

export const getAcademicYears = async (req, res) => {
  try {
    const [academicYears] = await pool.query(`
      SELECT id, year, semester, start_date, end_date, is_active
      FROM academic_years
      ORDER BY is_active DESC, start_date DESC
    `);

    res.json(academicYears);
  } catch (error) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
};
