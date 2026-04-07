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
      const body = Array.isArray(req.body) ? req.body[0] : req.body;
      subjectId = body?.subjectId;
      classId = body?.classId;
    } else {
      const markId = req.params.id;
      const [markRows] = await pool.query(
        'SELECT subject_id, class_id FROM marks WHERE id = $1',
        [markId]
      );

      if (!markRows || markRows.length === 0) {
        return res.status(404).json({ error: 'Mark not found' });
      }

      subjectId = markRows[0].subject_id;
      classId = markRows[0].class_id;
    }

    const [assignmentRows] = await pool.query(
      'SELECT 1 FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2 AND class_id = $3 LIMIT 1',
      [teacherId, subjectId, classId]
    );

    if (!assignmentRows || assignmentRows.length === 0) {
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

    const [homeroomRows] = await pool.query(
      'SELECT 1 FROM classes WHERE id = $1 AND homeroom_teacher_id = $2 LIMIT 1',
      [classId, teacherId]
    );

    if (!homeroomRows || homeroomRows.length === 0) {
      return res.status(403).json({ error: 'Access restricted to your homeroom class' });
    }

    next();
  } catch (error) {
    console.error('Error in checkHomeroomAccess:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
