import pool from '../config/database.js';

export const checkTeacherSubjectAccess = async (req, res, next) => {
  try {
    const teacherId = req.user?.teacherId;

    if (!teacherId) {
      return res.status(403).json({ error: 'Teachers can only add marks for their assigned subject and class' });
    }

    let subjectId;
    let classId;

    if (req.method === 'POST') {
      // For create: read from req.body (may be array or single object)
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      subjectId = body?.subjectId;
      classId = body?.classId;
    } else {
      // For update: look up the existing mark from DB
      const markId = req.params.id;
      const [rows] = await pool.query(
        'SELECT subject_id, class_id FROM marks WHERE id = ?',
        [markId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Mark not found' });
      }

      subjectId = rows[0].subject_id;
      classId = rows[0].class_id;
    }

    const [rows] = await pool.query(
      'SELECT 1 FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ? AND class_id = ? LIMIT 1',
      [teacherId, subjectId, classId]
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({ error: 'Teachers can only add marks for their assigned subject and class' });
    }

    next();
  } catch (error) {
    console.error('Error in checkTeacherSubjectAccess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkHomeroomAccess = async (req, res, next) => {
  try {
    const teacherId = req.user?.teacherId;

    if (!teacherId) {
      return res.status(403).json({ error: 'Access restricted to your homeroom class' });
    }

    const classId = req.query?.classId || req.params?.classId;

    const [rows] = await pool.query(
      'SELECT 1 FROM classes WHERE id = ? AND homeroom_teacher_id = ? LIMIT 1',
      [classId, teacherId]
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({ error: 'Access restricted to your homeroom class' });
    }

    next();
  } catch (error) {
    console.error('Error in checkHomeroomAccess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
