-- ============================================================
-- Update Schema Migration
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
--
-- Business rules enforced:
--   • One teacher teaches exactly ONE subject
--   • One subject CAN be taught by MANY teachers (in different classes)
--   • Unique constraint on teacher_subjects is (teacher_id, subject_id, class_id, academic_year_id)
--     which correctly allows multiple teachers to share a subject across classes
-- ============================================================

-- 0. Drop any incorrect unique constraint that would prevent multiple teachers
--    from sharing the same subject (e.g. a unique on teacher_id+subject_id alone)
DROP INDEX IF EXISTS teacher_subjects_teacher_subject_unique;
ALTER TABLE teacher_subjects
  DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_subject_key;
ALTER TABLE teacher_subjects
  DROP CONSTRAINT IF EXISTS uq_teacher_subject;

-- Ensure the correct composite unique constraint exists
ALTER TABLE teacher_subjects
  DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_subject_id_class_id_academic_year_id_key;

ALTER TABLE teacher_subjects
  ADD CONSTRAINT teacher_subjects_teacher_id_subject_id_class_id_academic_year_id_key
  UNIQUE (teacher_id, subject_id, class_id, academic_year_id);

-- 1. Ensure homeroom_teacher_id is nullable (optional homeroom teacher)
ALTER TABLE classes
  ALTER COLUMN homeroom_teacher_id DROP NOT NULL;

-- Re-apply FK with ON DELETE SET NULL in case it was recreated differently
ALTER TABLE classes
  DROP CONSTRAINT IF EXISTS classes_homeroom_teacher_id_fkey;

ALTER TABLE classes
  ADD CONSTRAINT classes_homeroom_teacher_id_fkey
  FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- 2. Fix role check constraint to match what the app sends
--    (backend uses lowercase: 'admin', 'teacher', 'student')
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'teacher', 'student'));

-- 3. Ensure academic_year_id on classes is also nullable
ALTER TABLE classes
  ALTER COLUMN academic_year_id DROP NOT NULL;

-- 4. Ensure departments.head_teacher_id uses ON DELETE SET NULL
ALTER TABLE departments
  DROP CONSTRAINT IF EXISTS departments_head_teacher_id_fkey;

ALTER TABLE departments
  ADD CONSTRAINT departments_head_teacher_id_fkey
  FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- 5. Convert legacy semester values to the current format
UPDATE academic_years
SET semester = '1'
WHERE semester = 'Spring';

UPDATE academic_years
SET semester = '2'
WHERE semester = 'Fall';

-- 6. Enforce current semester constraint ('1' or '2' only)
ALTER TABLE academic_years
  DROP CONSTRAINT IF EXISTS academic_years_semester_check;

ALTER TABLE academic_years
  ADD CONSTRAINT academic_years_semester_check
  CHECK (semester IN ('1', '2'));

-- 7. Add missing index on classes homeroom_teacher_id if not exists
CREATE INDEX IF NOT EXISTS idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);

-- 8. Add missing index on classes academic_year_id if not exists
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);

-- 9. Ensure updated_at exists on marks (in case it was missing)
ALTER TABLE marks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 10. Ensure the default academic year seed matches the current schema
INSERT INTO academic_years (year, semester, start_date, end_date, is_active)
VALUES ('2025-2026', '1', '2025-01-01', '2025-06-30', TRUE)
ON CONFLICT (year, semester) DO NOTHING;

-- 11. Seed one teacher user, one class, and one student for initial access
--     without requiring a homeroom teacher assignment up front
INSERT INTO users (username, password, role, is_active) VALUES
  ('teacher1', '$2b$10$N2t83pbWKN4yH9TvgLkDmeahw/fOrFDhNGlvRF94eArUVaq4pEz6G', 'teacher', TRUE),
  ('student1', '$2b$10$yWuQMaq/cPTYC4S7v70O4uy8uT0K2qFmTzHUh9ZQFQ12F1K0Zo7O.', 'student', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_profiles (user_id, full_name, email)
SELECT id, 'Abel Tesfaye', 'teacher1@marvelschool.edu'
FROM users
WHERE username = 'teacher1'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, full_name, email)
SELECT id, 'Sara Ali', 'student1@marvelschool.edu'
FROM users
WHERE username = 'student1'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teachers (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  department_id,
  hire_date,
  qualification,
  address,
  emergency_contact,
  emergency_phone,
  is_active
)
SELECT
  u.id,
  'Abel',
  'Tesfaye',
  'teacher1@marvelschool.edu',
  '+251900000001',
  d.id,
  '2025-01-15',
  'B.Ed Mathematics',
  'Addis Ababa',
  'Meron Tesfaye',
  '+251900000011',
  TRUE
FROM users u
JOIN departments d ON d.code = 'MATH'
WHERE u.username = 'teacher1'
  AND NOT EXISTS (
    SELECT 1
    FROM teachers t
    WHERE t.user_id = u.id
  );

INSERT INTO classes (
  name,
  grade,
  section,
  academic_year_id,
  homeroom_teacher_id,
  max_students
)
SELECT
  'Grade 10 A',
  '10',
  'A',
  ay.id,
  NULL,
  40
FROM academic_years ay
WHERE ay.year = '2025-2026'
  AND ay.semester = '1'
  AND NOT EXISTS (
    SELECT 1
    FROM classes c
    WHERE c.name = 'Grade 10 A'
      AND c.grade = '10'
      AND c.section = 'A'
      AND c.academic_year_id = ay.id
  );

INSERT INTO students (
  user_id,
  first_name,
  last_name,
  email,
  phone,
  class_id,
  roll_number,
  admission_number,
  date_of_birth,
  gender,
  blood_group,
  address,
  parent_guardian_name,
  parent_guardian_phone,
  parent_guardian_email,
  emergency_contact,
  emergency_phone,
  admission_date,
  is_active
)
SELECT
  u.id,
  'Sara',
  'Ali',
  'student1@marvelschool.edu',
  '+251900000002',
  c.id,
  '10A-001',
  'ADM-2025-001',
  '2010-03-14',
  'Female',
  'O+',
  'Addis Ababa',
  'Amina Ali',
  '+251900000012',
  'amina.ali@example.com',
  'Amina Ali',
  '+251900000012',
  '2025-01-20',
  TRUE
FROM users u
JOIN classes c
  ON c.name = 'Grade 10 A'
 AND c.grade = '10'
 AND c.section = 'A'
WHERE u.username = 'student1'
  AND NOT EXISTS (
    SELECT 1
    FROM students s
    WHERE s.user_id = u.id
       OR s.admission_number = 'ADM-2025-001'
  );

INSERT INTO teacher_subjects (
  teacher_id,
  subject_id,
  class_id,
  academic_year_id
)
SELECT
  t.id,
  s.id,
  c.id,
  ay.id
FROM teachers t
JOIN users u ON u.id = t.user_id
JOIN subjects s ON s.code = 'MATH'
JOIN classes c
  ON c.name = 'Grade 10 A'
 AND c.grade = '10'
 AND c.section = 'A'
JOIN academic_years ay
  ON ay.id = c.academic_year_id
WHERE u.username = 'teacher1'
ON CONFLICT (teacher_id, subject_id, class_id, academic_year_id) DO NOTHING;

-- Done
