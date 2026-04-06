import pool from '../config/database.js';

async function getTeacherAssignments(teacherId) {
  const [assignments] = await pool.query(
    `SELECT teacher_id, subject_id, class_id, academic_year_id
     FROM teacher_subjects
     WHERE teacher_id = ?`,
    [teacherId]
  );

  return assignments;
}

function isAssignmentAllowed(assignments, subjectId, classId) {
  return assignments.some((assignment) => (
    Number(assignment.subject_id) === Number(subjectId) &&
    Number(assignment.class_id) === Number(classId)
  ));
}

export const getMarks = async (req, res) => {
  try {
    const { studentId } = req.query;

    let query = `
      SELECT 
        m.id,
        m.student_id,
        s.first_name,
        s.last_name,
        s.admission_number,
        m.subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        m.class_id,
        c.name as class_name,
        c.grade,
        c.section,
        m.exam_type_id,
        et.name as exam_type_name,
        et.code as exam_type_code,
        m.academic_year_id,
        ay.year as academic_year,
        ay.semester,
        m.marks_obtained,
        m.max_marks,
        m.grade,
        m.remarks,
        m.teacher_id,
        t.first_name as teacher_first_name,
        t.last_name as teacher_last_name,
        m.exam_date,
        m.created_at,
        m.updated_at
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN classes c ON m.class_id = c.id
      JOIN exam_types et ON m.exam_type_id = et.id
      LEFT JOIN academic_years ay ON m.academic_year_id = ay.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
    `;

    const params = [];
    const filters = [];

    if (studentId) {
      filters.push('m.student_id = ?');
      params.push(studentId);
    }

    if (req.user.role === 'student' && req.user.studentId) {
      filters.push('m.student_id = ?');
      params.push(req.user.studentId);
    }

    if (req.user.role === 'teacher' && req.user.teacherId) {
      filters.push(
        `EXISTS (
          SELECT 1
          FROM teacher_subjects ts
          WHERE ts.teacher_id = ?
            AND ts.subject_id = m.subject_id
            AND ts.class_id = m.class_id
        )`
      );
      params.push(req.user.teacherId);
    }

    if (filters.length > 0) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ' ORDER BY m.exam_date DESC, sub.name, et.name';

    const [marks] = await pool.query(query, params);

    res.json(marks);
  } catch (error) {
    console.error('Error fetching marks:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};

export const createMarks = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    if (req.user.role !== 'teacher' || !req.user.teacherId) {
      return res.status(403).json({ error: 'Only teachers can enter marks' });
    }

    const marksPayload = Array.isArray(req.body) ? req.body : [req.body];

    if (marksPayload.length === 0) {
      return res.status(400).json({ error: 'At least one marks record is required' });
    }

    const teacherAssignments = await getTeacherAssignments(req.user.teacherId);

    if (teacherAssignments.length === 0) {
      return res.status(403).json({ error: 'Teacher has no class/subject assignment' });
    }

    await connection.beginTransaction();

    const markIds = [];

    for (const mark of marksPayload) {
      const {
        studentId,
        subjectId,
        classId,
        examTypeId,
        academicYearId,
        marksObtained,
        maxMarks,
        grade,
        remarks,
        teacherId,
        examDate
      } = mark;

      if (
        studentId === undefined ||
        subjectId === undefined ||
        classId === undefined ||
        examTypeId === undefined ||
        marksObtained === undefined ||
        maxMarks === undefined
      ) {
        await connection.rollback();
        return res.status(400).json({ error: 'Missing required fields for marks entry' });
      }

      if (!isAssignmentAllowed(teacherAssignments, subjectId, classId)) {
        await connection.rollback();
        return res.status(403).json({ error: 'Teachers can only add marks for their assigned subject and class' });
      }

      const [duplicates] = await connection.query(
        `SELECT id
         FROM marks
         WHERE student_id = ?
           AND subject_id = ?
           AND class_id = ?
           AND exam_type_id = ?
           AND ((academic_year_id IS NULL AND ? IS NULL) OR academic_year_id = ?)`,
        [studentId, subjectId, classId, examTypeId, academicYearId ?? null, academicYearId ?? null]
      );

      if (duplicates.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Marks for this student, subject, class, and exam type already exist' });
      }

      const [result] = await connection.query(
        `INSERT INTO marks 
         (student_id, subject_id, class_id, exam_type_id, academic_year_id, marks_obtained, max_marks, grade, remarks, teacher_id, exam_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, subjectId, classId, examTypeId, academicYearId || null, marksObtained, maxMarks, grade || null, remarks || null, req.user.teacherId, examDate || null]
      );

      markIds.push(result.insertId);
    }

    await connection.commit();

    res.status(201).json({
      message: 'Marks created successfully',
      count: markIds.length,
      markIds
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating marks:', error);
    res.status(500).json({ error: error.message || 'Failed to create marks' });
  } finally {
    connection.release();
  }
};

export const updateMark = async (req, res) => {
  try {
    if (req.user.role !== 'teacher' || !req.user.teacherId) {
      return res.status(403).json({ error: 'Only teachers can update marks' });
    }

    const { id } = req.params;
    const {
      studentId,
      subjectId,
      classId,
      examTypeId,
      academicYearId,
      marksObtained,
      maxMarks,
      grade,
      remarks,
      examDate,
      marks
    } = req.body;

    const [existingMarks] = await pool.query(
      'SELECT subject_id, class_id, academic_year_id FROM marks WHERE id = ?',
      [id]
    );

    if (existingMarks.length === 0) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    const teacherAssignments = await getTeacherAssignments(req.user.teacherId);
    const existingMark = existingMarks[0];

    if (!isAssignmentAllowed(
      teacherAssignments,
      subjectId ?? existingMark.subject_id,
      classId ?? existingMark.class_id
    )) {
      return res.status(403).json({ error: 'Teachers can only modify marks for their assigned subject and class' });
    }

    const fields = [];
    const values = [];

    if (studentId !== undefined) {
      fields.push('student_id = ?');
      values.push(studentId);
    }
    if (subjectId !== undefined) {
      fields.push('subject_id = ?');
      values.push(subjectId);
    }
    if (classId !== undefined) {
      fields.push('class_id = ?');
      values.push(classId);
    }
    if (examTypeId !== undefined) {
      fields.push('exam_type_id = ?');
      values.push(examTypeId);
    }
    if (academicYearId !== undefined) {
      fields.push('academic_year_id = ?');
      values.push(academicYearId);
    }
    if (marksObtained !== undefined || marks !== undefined) {
      fields.push('marks_obtained = ?');
      values.push(marksObtained ?? marks);
    }
    if (maxMarks !== undefined) {
      fields.push('max_marks = ?');
      values.push(maxMarks);
    }
    if (grade !== undefined) {
      fields.push('grade = ?');
      values.push(grade);
    }
    if (remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(remarks);
    }
    fields.push('teacher_id = ?');
    values.push(req.user.teacherId);
    if (examDate !== undefined) {
      fields.push('exam_date = ?');
      values.push(examDate);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE marks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Marks updated successfully' });

  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ error: 'Failed to update marks' });
  }
};
