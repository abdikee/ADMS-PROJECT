import pool from '../config/database.js';

const EXAM_WEIGHTS = { MIDTERM: 30, FINAL: 50, QUIZ: 10, ASSIGNMENT: 10 };

function computeWeightedTotal(marksByCategory, subjectMaxMarks) {
  let total = 0;
  for (const [code, weightage] of Object.entries(EXAM_WEIGHTS)) {
    const scaledMax = subjectMaxMarks * (weightage / 100);
    const obtained = marksByCategory[code] ?? 0;
    total += scaledMax > 0 ? (obtained / scaledMax) * weightage : 0;
  }
  return parseFloat(total.toFixed(2));
}

export const getStudentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { academicYearId } = req.query;

    if (req.user.role === 'student' && Number(req.user.studentId) !== Number(id)) {
      return res.status(403).json({ error: 'Students can only view their own report' });
    }

    const [students] = await pool.query(`
      SELECT
        s.id,
        s.first_name,
        s.last_name,
        s.admission_number,
        s.roll_number,
        s.email,
        s.phone,
        s.gender,
        s.date_of_birth,
        c.id AS class_id,
        c.name AS class_name,
        c.grade,
        c.section,
        ay.id AS academic_year_id,
        ay.year AS academic_year,
        ay.semester
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE s.id = ?
    `, [id]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    if (req.user.role === 'teacher' && req.user.teacherId) {
      const [assignments] = await pool.query(
        'SELECT id FROM teacher_subjects WHERE teacher_id = ? AND class_id = ? LIMIT 1',
        [req.user.teacherId, student.class_id]
      );
      const allowed = student.class_id ? assignments.length > 0 : false;

      if (!allowed) {
        return res.status(403).json({ error: 'Teachers can only view reports for their assigned classes' });
      }
    }

    let marksQuery = `
      SELECT
        m.id,
        m.subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        sub.max_marks AS subject_max_marks,
        sub.passing_marks AS subject_passing_marks,
        m.exam_type_id,
        et.name AS exam_type_name,
        et.code AS exam_type_code,
        et.weightage,
        m.marks_obtained,
        m.max_marks,
        m.grade,
        m.remarks,
        m.exam_date,
        (m.marks_obtained / m.max_marks * 100) AS percentage
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exam_types et ON m.exam_type_id = et.id
      WHERE m.student_id = ?
    `;

    const params = [id];

    if (academicYearId) {
      marksQuery += ' AND m.academic_year_id = ?';
      params.push(academicYearId);
    }

    if (req.user.role === 'teacher' && req.user.teacherId) {
      marksQuery += `
        AND EXISTS (
          SELECT 1
          FROM teacher_subjects ts
          WHERE ts.teacher_id = ?
            AND ts.class_id = m.class_id
            AND ts.subject_id = m.subject_id
        )
      `;
      params.push(req.user.teacherId);
    }

    marksQuery += ' ORDER BY sub.name, et.name';

    const [marks] = await pool.query(marksQuery, params);

    let totalObtained = 0;
    let totalMax = 0;
    const subjectAverages = {};

    marks.forEach((mark) => {
      totalObtained += parseFloat(mark.marks_obtained) || 0;
      totalMax += parseFloat(mark.max_marks) || 0;

      if (!subjectAverages[mark.subject_id]) {
        subjectAverages[mark.subject_id] = {
          name: mark.subject_name,
          totalObtained: 0,
          totalMax: 0
        };
      }

      subjectAverages[mark.subject_id].totalObtained += parseFloat(mark.marks_obtained) || 0;
      subjectAverages[mark.subject_id].totalMax += parseFloat(mark.max_marks) || 0;
    });

    const average = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const status = average >= 40 ? 'PASS' : 'FAIL';

    res.json({
      student,
      marks,
      summary: {
        totalObtained: parseFloat(totalObtained.toFixed(2)),
        totalMax: parseFloat(totalMax.toFixed(2)),
        average: parseFloat(average.toFixed(2)),
        status,
        subjectCount: Object.keys(subjectAverages).length,
        markCount: marks.length
      }
    });
  } catch (error) {
    console.error('Error fetching student report:', error);
    res.status(500).json({ error: 'Failed to fetch student report' });
  }
};

export const getClassReport = async (req, res) => {
  try {
    const { classId, academicYearId } = req.query;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    if (req.user.role === 'student') {
      return res.status(403).json({ error: 'Students cannot access class reports' });
    }

    const [classes] = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.grade,
        c.section,
        c.max_students,
        t.first_name AS homeroom_teacher_first_name,
        t.last_name AS homeroom_teacher_last_name,
        ay.year AS academic_year,
        ay.semester
      FROM classes c
      LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE c.id = ?
    `, [classId]);

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const classInfo = classes[0];

    let studentsQuery = `
      SELECT
        s.id,
        s.first_name,
        s.last_name,
        s.admission_number,
        s.roll_number,
        s.gender,
        s.is_active,
        COUNT(DISTINCT m.subject_id) AS subject_count,
        COUNT(m.id) AS mark_count,
        COALESCE(SUM(m.marks_obtained), 0) AS total_marks,
        COALESCE(SUM(m.max_marks), 0) AS total_max_marks,
        CASE
          WHEN COUNT(m.id) > 0 THEN ROUND(AVG(m.marks_obtained / m.max_marks * 100), 2)
          ELSE 0
        END AS average_percentage
      FROM students s
      LEFT JOIN marks m ON s.id = m.student_id
      WHERE s.class_id = ?
    `;

    const params = [classId];

    if (academicYearId) {
      studentsQuery += ' AND (m.academic_year_id = ? OR m.id IS NULL)';
      params.push(academicYearId);
    }

    if (req.user.role === 'teacher' && req.user.teacherId) {
      studentsQuery += `
        AND (
          m.id IS NULL OR EXISTS (
            SELECT 1
            FROM teacher_subjects ts
            WHERE ts.teacher_id = ?
              AND ts.class_id = s.class_id
              AND ts.subject_id = m.subject_id
          )
        )
      `;
      params.push(req.user.teacherId);
    }

    studentsQuery += ' GROUP BY s.id ORDER BY s.first_name, s.last_name';

    const [students] = await pool.query(studentsQuery, params);

    // Fetch all marks for the class to compute weighted totals
    let marksQuery = `
      SELECT m.student_id, m.subject_id, sub.max_marks as subject_max_marks,
             et.code as exam_type_code, m.marks_obtained
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exam_types et ON m.exam_type_id = et.id
      WHERE m.class_id = ?
    `;

    const marksParams = [classId];

    if (academicYearId) {
      marksQuery += ' AND m.academic_year_id = ?';
      marksParams.push(academicYearId);
    }

    const [allMarks] = await pool.query(marksQuery, marksParams);

    // Group marks by student_id → subject_id → exam_type_code
    const marksByStudent = {};
    for (const row of allMarks) {
      const { student_id, subject_id, subject_max_marks, exam_type_code, marks_obtained } = row;
      if (!marksByStudent[student_id]) marksByStudent[student_id] = {};
      if (!marksByStudent[student_id][subject_id]) {
        marksByStudent[student_id][subject_id] = { maxMarks: subject_max_marks, byCategory: {} };
      }
      marksByStudent[student_id][subject_id].byCategory[exam_type_code] =
        (marksByStudent[student_id][subject_id].byCategory[exam_type_code] ?? 0) + (parseFloat(marks_obtained) || 0);
    }

    // Compute weightedTotal per student (average across subjects)
    const weightedTotals = {};
    for (const student of students) {
      const subjectMap = marksByStudent[student.id];
      if (!subjectMap || Object.keys(subjectMap).length === 0) {
        weightedTotals[student.id] = 0;
      } else {
        const subjectScores = Object.values(subjectMap).map(({ maxMarks, byCategory }) =>
          computeWeightedTotal(byCategory, maxMarks)
        );
        weightedTotals[student.id] = parseFloat(
          (subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length).toFixed(2)
        );
      }
    }

    // Sort by weightedTotal descending
    const sortedStudents = [...students].sort((a, b) => {
      const diff = weightedTotals[b.id] - weightedTotals[a.id];
      if (diff !== 0) return diff;
      return a.first_name.localeCompare(b.first_name);
    });

    let currentRank = 0;
    let previousWeighted = null;

    const studentsWithRank = sortedStudents.map((student, index) => {
      const weightedTotal = weightedTotals[student.id];
      const avg = parseFloat(student.average_percentage) || 0;

      if (previousWeighted !== weightedTotal) {
        currentRank = index + 1;
      }

      previousWeighted = weightedTotal;

      return {
        ...student,
        total_marks: parseFloat(student.total_marks) || 0,
        total_max_marks: parseFloat(student.total_max_marks) || 0,
        average_percentage: avg,
        weightedTotal,
        rank: currentRank,
        status: weightedTotal >= 40 ? 'PASS' : 'FAIL'
      };
    });

    const classStats = {
      totalStudents: students.length,
      activeStudents: students.filter((student) => student.is_active).length,
      passCount: studentsWithRank.filter((student) => student.status === 'PASS').length,
      failCount: studentsWithRank.filter((student) => student.status === 'FAIL').length,
      classAverage: students.length > 0
        ? parseFloat((studentsWithRank.reduce((sum, student) => sum + student.weightedTotal, 0) / students.length).toFixed(2))
        : 0
    };

    res.json({
      class: classInfo,
      students: studentsWithRank,
      statistics: classStats
    });
  } catch (error) {
    console.error('Error fetching class report:', error);
    res.status(500).json({ error: 'Failed to fetch class report' });
  }
};
