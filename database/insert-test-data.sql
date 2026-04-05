-- ============================================
-- Insert Test Data for SAMS
-- ============================================

USE sams_db;

-- Insert Academic Year (if not exists)
INSERT IGNORE INTO academic_years (year, semester, start_date, end_date, is_active)
VALUES ('2025-2026', 'Spring', '2025-01-01', '2025-06-30', TRUE);

SET @academic_year_id = (SELECT id FROM academic_years WHERE year = '2025-2026' AND semester = 'Spring');

-- Insert Departments (if not exists)
INSERT IGNORE INTO departments (name, code, description) VALUES
('Mathematics', 'MATH', 'Mathematics Department'),
('English', 'ENG', 'English Department'),
('Science', 'SCI', 'Science Department'),
('Social Studies', 'SS', 'Social Studies Department');

SET @math_dept = (SELECT id FROM departments WHERE code = 'MATH');
SET @eng_dept = (SELECT id FROM departments WHERE code = 'ENG');
SET @sci_dept = (SELECT id FROM departments WHERE code = 'SCI');

-- Insert Classes
INSERT INTO classes (name, grade, section, academic_year_id, max_students) VALUES
('Grade 10 - Section A', '10', 'A', @academic_year_id, 40),
('Grade 10 - Section B', '10', 'B', @academic_year_id, 40),
('Grade 9 - Section A', '9', 'A', @academic_year_id, 40);

SET @class_10a = (SELECT id FROM classes WHERE grade = '10' AND section = 'A');
SET @class_10b = (SELECT id FROM classes WHERE grade = '10' AND section = 'B');
SET @class_9a = (SELECT id FROM classes WHERE grade = '9' AND section = 'A');

-- Create user accounts for students (with temporary usernames that will be replaced)
INSERT INTO users (username, password, role) VALUES
(CONCAT('temp_student_', UUID_SHORT()), '', 'student'),
(CONCAT('temp_student_', UUID_SHORT()), '', 'student'),
(CONCAT('temp_student_', UUID_SHORT()), '', 'student'),
(CONCAT('temp_student_', UUID_SHORT()), '', 'student'),
(CONCAT('temp_student_', UUID_SHORT()), '', 'student');

-- Insert Students
INSERT INTO students (user_id, first_name, last_name, email, class_id, gender, admission_date) VALUES
((SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 0), 'John', 'Doe', 'john.doe@school.com', @class_10a, 'Male', '2024-09-01'),
((SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 1), 'Jane', 'Smith', 'jane.smith@school.com', @class_10a, 'Female', '2024-09-01'),
((SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 2), 'Michael', 'Johnson', 'michael.j@school.com', @class_10b, 'Male', '2024-09-01'),
((SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 3), 'Emily', 'Williams', 'emily.w@school.com', @class_9a, 'Female', '2024-09-01'),
((SELECT id FROM users WHERE role = 'student' ORDER BY id LIMIT 1 OFFSET 4), 'David', 'Brown', 'david.b@school.com', @class_9a, 'Male', '2024-09-01');

-- Create user accounts for teachers (with temporary usernames that will be replaced)
INSERT INTO users (username, password, role) VALUES
(CONCAT('temp_teacher_', UUID_SHORT()), '', 'teacher'),
(CONCAT('temp_teacher_', UUID_SHORT()), '', 'teacher'),
(CONCAT('temp_teacher_', UUID_SHORT()), '', 'teacher');

-- Insert Teachers
INSERT INTO teachers (user_id, first_name, last_name, email, department_id, qualification, hire_date) VALUES
((SELECT id FROM users WHERE role = 'teacher' ORDER BY id LIMIT 1 OFFSET 0), 'Sarah', 'Anderson', 'sarah.a@school.com', @math_dept, 'M.Sc Mathematics', '2020-08-01'),
((SELECT id FROM users WHERE role = 'teacher' ORDER BY id LIMIT 1 OFFSET 1), 'Robert', 'Martinez', 'robert.m@school.com', @eng_dept, 'M.A English', '2019-08-01'),
((SELECT id FROM users WHERE role = 'teacher' ORDER BY id LIMIT 1 OFFSET 2), 'Lisa', 'Thompson', 'lisa.t@school.com', @sci_dept, 'Ph.D Biology', '2018-08-01');

-- Insert Subjects
INSERT INTO subjects (name, code, max_marks, passing_marks, department_id) VALUES
('Mathematics', 'MATH101', 100, 40, @math_dept),
('English', 'ENG101', 100, 40, @eng_dept),
('Biology', 'BIO101', 100, 40, @sci_dept),
('Chemistry', 'CHEM101', 100, 40, @sci_dept),
('Physics', 'PHY101', 100, 40, @sci_dept);

-- Show results
SELECT 'Test data inserted successfully!' as message;

SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as teacher_count FROM teachers;
SELECT COUNT(*) as class_count FROM classes;
SELECT COUNT(*) as subject_count FROM subjects;

-- Show students and their credential status
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.email,
    u.username,
    CASE 
        WHEN u.username LIKE 'temp_%' THEN 'Needs credentials' 
        WHEN u.username IS NOT NULL THEN 'Has credentials'
        ELSE 'No credentials' 
    END as status
FROM students s
LEFT JOIN users u ON s.user_id = u.id;
