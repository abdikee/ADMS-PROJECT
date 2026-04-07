-- ============================================================
-- Seed: Sample Marks Data
-- ============================================================

INSERT INTO marks (student_id, subject_id, class_id, exam_type_id, academic_year_id, marks_obtained, max_marks, grade, remarks, teacher_id, exam_date)
SELECT
  s.id,
  sub.id,
  c.id,
  et.id,
  ay.id,
  vals.marks_obtained,
  100,
  vals.grade,
  vals.remarks,
  t.id,
  vals.exam_date
FROM (VALUES
  ('MATH101', 'MIDTERM',    72::numeric, 'B+', 'Good performance',      '2025-03-15'::date),
  ('MATH101', 'FINAL',      85::numeric, 'A',  'Excellent improvement', '2025-06-10'::date),
  ('MATH101', 'QUIZ',        9::numeric, 'A',  NULL,                    '2025-02-20'::date),
  ('MATH101', 'ASSIGNMENT',  8::numeric, 'B+', 'Well structured',       '2025-02-10'::date),
  ('PHY101',  'MIDTERM',    65::numeric, 'B',  NULL,                    '2025-03-16'::date),
  ('PHY101',  'FINAL',      78::numeric, 'A-', 'Good understanding',    '2025-06-11'::date),
  ('PHY101',  'QUIZ',        7::numeric, 'B+', NULL,                    '2025-02-21'::date),
  ('PHY101',  'ASSIGNMENT',  9::numeric, 'A',  'Excellent work',        '2025-02-11'::date)
) AS vals(subject_code, exam_type_code, marks_obtained, grade, remarks, exam_date)
JOIN subjects sub ON sub.code = vals.subject_code
JOIN exam_types et ON et.code = vals.exam_type_code
JOIN students s ON s.admission_number = 'ADM-2025-001'
JOIN classes c ON c.id = s.class_id
JOIN academic_years ay ON ay.id = c.academic_year_id
JOIN teachers t ON t.first_name = 'Abel' AND t.last_name = 'Tesfaye'
ON CONFLICT DO NOTHING;
