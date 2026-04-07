import pool from '../config/database.js';

// Helper: produces "$N" placeholder string
const p = (n) => '$' + n;

async function getTeacherAssignments(teacherId) {
  const [assignments] = await pool.query(
    `SELECT teacher_id, subject_id, class_id, academic_year_id
     FROM teacher_subjects
     WHERE teacher_id = ${p(1)}`,
    [Number(teacherId)]
  );
  return assignments;
}

function isAssignmentAllowed(assignments, subjectId, classId) {
  return assignments.some((a) =>
    Number(a.subject_id) === Number(subjectId) &&
    Number(a.class_id) === Number(classId)
  );
}

export const getMarks = async (req, res) => {
  try {
    const { studentId } = req.query;

    let query = `
      SELECT
        m.id, m.student_id,
        s.first_name, s.last_name, s.admission_number,
        m.subject_id, sub.name as subject_name, sub.code as subject_code,
        m.class_id, c.name as class_name, c.grade, c.section,
        m.exam_type_id, et.name as exam_type_name, et.code as exam_type_code,
        m.academic_year_id, ay.year as academic_year, ay.semester,
        m.marks_obtained, m.max_marks, m.grade, m.remarks,
        m.teacher_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        m.exam_date, m.created_at, m.updated_at
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
    let i = 1;

    if (studentId) {
      filters.push('m.student_id = ' + p(i));
      params.push(Number(studentId));
      i++;
    }

    if (req.user.role === 'student' && req.user.studentId) {
      filters.push('m.student_id = ' + p(i));
      params.push(Number(req.user.studentId));
      i++;
    }

    if (req.user.role === 'teacher' && req.user.teacherId) {
      filters.push(
        'EXISTS (SELECT 1 FROM teacher_subjects ts WHERE ts.teacher_id = ' + p(i) +
        ' AND ts.subject_id = m.subject_id AND ts.class_id = m.class_id)'
      );
      params.push(Number(req.user.teacherId));
      i++;
    }

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
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
      const { studentId, subjectId, classId, examTypeId, academicYearId, marksObtained, maxMarks, grade, remarks, examDate } = mark;

      const studentIdNum      = Number(studentId);
      const subjectIdNum      = Number(subjectId);
      const classIdNum        = Number(classId);
      const examTypeIdNum     = Number(examTypeId);
      const academicYearIdNum = academicYearId ? Number(academicYearId) : null;
      const marksObtainedNum  = Number(marksObtained);
      const maxMarksNum       = Number(maxMarks);

      if (isNaN(studentIdNum) || isNaN(subjectIdNum) || isNaN(classIdNum) ||
          isNaN(examTypeIdNum) || isNaN(marksObtainedNum) || isNaN(maxMarksNum)) {
        await connection.rollback();
        return res.status(400).json({ error: 'Invalid numeric values provided' });
      }

      if (!isAssignmentAllowed(teacherAssignments, subjectIdNum, classIdNum)) {
        await connection.rollback();
        return res.status(403).json({ error: 'Teachers can only add marks for their assigned subject and class' });
      }

      const [duplicates] = await connection.query(
        'SELECT id FROM marks WHERE student_id = ' + p(1) + ' AND subject_id = ' + p(2) +
        ' AND class_id = ' + p(3) + ' AND exam_type_id = ' + p(4) +
        ' AND ((academic_year_id IS NULL AND ' + p(5) + '::int IS NULL) OR academic_year_id = ' + p(5) + '::int)',
        [studentIdNum, subjectIdNum, classIdNum, examTypeIdNum, academicYearIdNum]
      );

      if (duplicates.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Marks for this student, subject, class, and exam type already exist' });
      }

      const [result] = await connection.query(
        'INSERT INTO marks (student_id, subject_id, class_id, exam_type_id, academic_year_id, marks_obtained, max_marks, grade, remarks, teacher_id, exam_date) ' +
        'VALUES (' + p(1) + ', ' + p(2) + ', ' + p(3) + ', ' + p(4) + ', ' + p(5) + ', ' + p(6) + ', ' + p(7) + ', ' + p(8) + ', ' + p(9) + ', ' + p(10) + ', ' + p(11) + ')',
        [studentIdNum, subjectIdNum, classIdNum, examTypeIdNum, academicYearIdNum, marksObtainedNum, maxMarksNum, grade || null, remarks || null, req.user.teacherId, examDate || null]
      );

      markIds.push(result.insertId);
    }

    await connection.commit();
    res.status(201).json({ message: 'Marks created successfully', count: markIds.length, markIds });
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
    const { studentId, subjectId, classId, examTypeId, academicYearId, marksObtained, maxMarks, grade, remarks, examDate, marks } = req.body;

    const markIdNum = Number(id);
    if (isNaN(markIdNum)) {
      return res.status(400).json({ error: 'Invalid mark ID' });
    }

    const [existingMarks] = await pool.query(
      'SELECT subject_id, class_id FROM marks WHERE id = ' + p(1),
      [markIdNum]
    );

    if (existingMarks.length === 0) {
      return res.status(404).json({ error: 'Mark not found' });
    }

    const teacherAssignments = await getTeacherAssignments(req.user.teacherId);
    const existingMark = existingMarks[0];

    if (!isAssignmentAllowed(
      teacherAssignments,
      subjectId ? Number(subjectId) : existingMark.subject_id,
      classId ? Number(classId) : existingMark.class_id
    )) {
      return res.status(403).json({ error: 'Teachers can only modify marks for their assigned subject and class' });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (studentId !== undefined)                          { fields.push('student_id = '      + p(i)); values.push(Number(studentId));                          i++; }
    if (subjectId !== undefined)                          { fields.push('subject_id = '      + p(i)); values.push(Number(subjectId));                          i++; }
    if (classId !== undefined)                            { fields.push('class_id = '        + p(i)); values.push(Number(classId));                            i++; }
    if (examTypeId !== undefined)                         { fields.push('exam_type_id = '    + p(i)); values.push(Number(examTypeId));                         i++; }
    if (academicYearId !== undefined)                     { fields.push('academic_year_id = '+ p(i)); values.push(academicYearId ? Number(academicYearId) : null); i++; }
    if (marksObtained !== undefined || marks !== undefined) { fields.push('marks_obtained = ' + p(i)); values.push(Number(marksObtained ?? marks));            i++; }
    if (maxMarks !== undefined)                           { fields.push('max_marks = '       + p(i)); values.push(Number(maxMarks));                           i++; }
    if (grade !== undefined)                              { fields.push('grade = '           + p(i)); values.push(grade);                                      i++; }
    if (remarks !== undefined)                            { fields.push('remarks = '         + p(i)); values.push(remarks);                                    i++; }
    if (examDate !== undefined)                           { fields.push('exam_date = '       + p(i)); values.push(examDate);                                   i++; }

    fields.push('teacher_id = ' + p(i));
    values.push(Number(req.user.teacherId));
    i++;

    values.push(markIdNum);

    await pool.query(
      'UPDATE marks SET ' + fields.join(', ') + ' WHERE id = ' + p(i),
      values
    );

    res.json({ message: 'Mark updated successfully' });
  } catch (error) {
    console.error('Error updating marks:', error);
    res.status(500).json({ error: 'Failed to update marks' });
  }
};
