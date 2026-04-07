import pool from '../config/database.js';

let ensureTablePromise;

function ensureCourseRegistrationsTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS course_registrations (
        id BIGSERIAL PRIMARY KEY,
        student_id BIGINT NOT NULL,
        subject_id BIGINT NOT NULL,
        academic_year_id BIGINT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_course_registration UNIQUE (student_id, subject_id, academic_year_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE
      )
    `);
  }

  return ensureTablePromise;
}

export const getMyCourseRegistrations = async (req, res) => {
  try {
    await ensureCourseRegistrationsTable();

    const [registrations] = await pool.query(`
      SELECT
        cr.id,
        cr.subject_id,
        cr.academic_year_id,
        cr.status,
        cr.created_at,
        sub.name AS subject_name,
        sub.code AS subject_code,
        ay.year AS academic_year,
        ay.semester
      FROM course_registrations cr
      JOIN subjects sub ON cr.subject_id = sub.id
      JOIN academic_years ay ON cr.academic_year_id = ay.id
      WHERE cr.student_id = $1
      ORDER BY ay.start_date DESC, sub.name
    `, [req.user.studentId]);

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching course registrations:', error);
    res.status(500).json({ error: 'Failed to fetch course registrations' });
  }
};

export const saveMyCourseRegistrations = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await ensureCourseRegistrationsTable();
    await connection.beginTransaction();

    const { academicYearId, subjectIds } = req.body;
    const normalizedSubjectIds = [...new Set(
      (Array.isArray(subjectIds) ? subjectIds : [])
        .map((subjectId) => Number(subjectId))
        .filter((subjectId) => Number.isInteger(subjectId) && subjectId > 0)
    )];

    if (!academicYearId) {
      return res.status(400).json({ error: 'Academic year is required' });
    }

    if (normalizedSubjectIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one subject' });
    }

    const [years] = await connection.query(
      'SELECT id FROM academic_years WHERE id = $1 LIMIT 1',
      [academicYearId]
    );

    if (years.length === 0) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    await connection.query(
      'DELETE FROM course_registrations WHERE student_id = $1 AND academic_year_id = $2 AND status = $3',
      [req.user.studentId, academicYearId, 'pending']
    );

    for (const subjectId of normalizedSubjectIds) {
      await connection.query(
        `INSERT INTO course_registrations (student_id, subject_id, academic_year_id, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (student_id, subject_id, academic_year_id)
         DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
        [req.user.studentId, subjectId, academicYearId]
      );
    }

    await connection.commit();

    res.json({
      message: 'Upcoming course registration saved successfully',
      count: normalizedSubjectIds.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving course registrations:', error);
    res.status(500).json({ error: error.message || 'Failed to save course registrations' });
  } finally {
    connection.release();
  }
};
