-- ============================================
-- Insert Test Data for SAMS (Simplified)
-- ============================================

USE sams_db;

-- Get or create academic year
SET @academic_year_id = (SELECT id FROM academic_years WHERE year = '2025-2026' AND semester = 'Spring' LIMIT 1);

-- Get or create departments
SET @math_dept = (SELECT id FROM departments WHERE code = 'MATH' LIMIT 1);
SET @eng_dept = (SELECT id FROM departments WHERE code = 'ENG' LIMIT 1);
SET @sci_dept = (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1);

-- Get or create classes
SET @class_10a = (SELECT id FROM classes WHERE grade = '10' AND section = 'A' LIMIT 1);

-- Create students with user accounts
-- Student 1: John Doe
INSERT INTO users (username, password, role) VALUES (CONCAT('temp_', FLOOR(RAND() * 1000000)), '', 'student');
SET @user_id1 = LAST_INSERT_ID();
INSERT INTO students (user_id, first_name, last_name, email, class_id, gender, admission_date) 
VALUES (@user_id1, 'John', 'Doe', 'john.doe@school.com', @class_10a, 'Male', '2024-09-01');

-- Student 2: Jane Smith
INSERT INTO users (username, password, role) VALUES (CONCAT('temp_', FLOOR(RAND() * 1000000)), '', 'student');
SET @user_id2 = LAST_INSERT_ID();
INSERT INTO students (user_id, first_name, last_name, email, class_id, gender, admission_date) 
VALUES (@user_id2, 'Jane', 'Smith', 'jane.smith@school.com', @class_10a, 'Female', '2024-09-01');

-- Student 3: Michael Johnson
INSERT INTO users (username, password, role) VALUES (CONCAT('temp_', FLOOR(RAND() * 1000000)), '', 'student');
SET @user_id3 = LAST_INSERT_ID();
INSERT INTO students (user_id, first_name, last_name, email, class_id, gender, admission_date) 
VALUES (@user_id3, 'Michael', 'Johnson', 'michael.j@school.com', @class_10a, 'Male', '2024-09-01');

-- Teacher 1: Sarah Anderson
INSERT INTO users (username, password, role) VALUES (CONCAT('temp_', FLOOR(RAND() * 1000000)), '', 'teacher');
SET @teacher_user_id1 = LAST_INSERT_ID();
INSERT INTO teachers (user_id, first_name, last_name, email, department_id, qualification, hire_date) 
VALUES (@teacher_user_id1, 'Sarah', 'Anderson', 'sarah.a@school.com', @math_dept, 'M.Sc Mathematics', '2020-08-01');

-- Teacher 2: Robert Martinez
INSERT INTO users (username, password, role) VALUES (CONCAT('temp_', FLOOR(RAND() * 1000000)), '', 'teacher');
SET @teacher_user_id2 = LAST_INSERT_ID();
INSERT INTO teachers (user_id, first_name, last_name, email, department_id, qualification, hire_date) 
VALUES (@teacher_user_id2, 'Robert', 'Martinez', 'robert.m@school.com', @eng_dept, 'M.A English', '2019-08-01');

-- Show results
SELECT 'Test data inserted successfully!' as message;
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as teacher_count FROM teachers;

-- Show students
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    u.username as current_username,
    'Ready for credential generation' as status
FROM students s
JOIN users u ON s.user_id = u.id
WHERE u.username LIKE 'temp_%';
