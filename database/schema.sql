-- ============================================
-- Student Academic Record Management System
-- Complete Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS sams_db;
USE sams_db;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (for authentication)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'student') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- Academic Years table
CREATE TABLE academic_years (
  id INT PRIMARY KEY AUTO_INCREMENT,
  year VARCHAR(20) NOT NULL,
  semester ENUM('1', '2', 'Spring', 'Fall') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_semester (year, semester),
  INDEX idx_active (is_active)
);

-- Departments table
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  head_teacher_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
);

-- Classes table
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  section VARCHAR(10),
  academic_year_id INT,
  homeroom_teacher_id INT,
  max_students INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_grade (grade),
  INDEX idx_academic_year (academic_year_id)
);

-- ============================================
-- PEOPLE TABLES
-- ============================================

-- Teachers table
CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  department_id INT,
  date_of_birth DATE,
  hire_date DATE,
  qualification VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  profile_photo VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_name (last_name, first_name),
  INDEX idx_email (email),
  INDEX idx_department (department_id)
) AUTO_INCREMENT=100001;

-- Students table
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  class_id INT,
  roll_number VARCHAR(20),
  admission_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  blood_group VARCHAR(5),
  address TEXT,
  parent_guardian_name VARCHAR(100),
  parent_guardian_phone VARCHAR(20),
  parent_guardian_email VARCHAR(100),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  admission_date DATE,
  profile_photo VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  INDEX idx_name (last_name, first_name),
  INDEX idx_class (class_id),
  INDEX idx_roll_number (roll_number),
  INDEX idx_admission_number (admission_number)
) AUTO_INCREMENT=200001;

-- User profiles table
CREATE TABLE user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(120),
  email VARCHAR(120),
  phone VARCHAR(30),
  profile_photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ACADEMIC TABLES
-- ============================================

-- Subjects table
CREATE TABLE subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  max_marks INT DEFAULT 100,
  passing_marks INT DEFAULT 40,
  department_id INT,
  credit_hours INT DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  INDEX idx_code (code),
  INDEX idx_name (name)
);

-- Teacher-Subject-Class mapping
CREATE TABLE teacher_subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  academic_year_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  UNIQUE KEY unique_assignment (teacher_id, subject_id, class_id, academic_year_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_subject (subject_id),
  INDEX idx_class (class_id)
);

-- Exam Types table
CREATE TABLE exam_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  weightage DECIMAL(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marks table
CREATE TABLE marks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  exam_type_id INT NOT NULL,
  academic_year_id INT,
  marks_obtained DECIMAL(5,2) NOT NULL,
  max_marks INT NOT NULL,
  grade VARCHAR(5),
  remarks TEXT,
  teacher_id INT,
  exam_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_subject (subject_id),
  INDEX idx_class (class_id),
  INDEX idx_exam_type (exam_type_id),
  INDEX idx_academic_year (academic_year_id)
);

-- ============================================
-- ATTENDANCE TABLES
-- ============================================

-- Attendance table
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  remarks TEXT,
  marked_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES teachers(id) ON DELETE SET NULL,
  UNIQUE KEY unique_attendance (student_id, date),
  INDEX idx_student (student_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- ============================================
-- ASSIGNMENT TABLES
-- ============================================

-- Assignments table
CREATE TABLE assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  class_id INT NOT NULL,
  teacher_id INT NOT NULL,
  academic_year_id INT,
  due_date DATETIME,
  max_marks INT DEFAULT 100,
  attachment_path VARCHAR(255),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  INDEX idx_subject (subject_id),
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_due_date (due_date)
);

-- Assignment submissions table
CREATE TABLE assignment_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT,
  file_path VARCHAR(255),
  marks_obtained DECIMAL(5,2),
  feedback TEXT,
  status ENUM('pending', 'submitted', 'graded', 'late') DEFAULT 'pending',
  submitted_at TIMESTAMP NULL,
  graded_at TIMESTAMP NULL,
  graded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES teachers(id) ON DELETE SET NULL,
  UNIQUE KEY unique_submission (assignment_id, student_id),
  INDEX idx_assignment (assignment_id),
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);

-- ============================================
-- TIMETABLE TABLES
-- ============================================

-- Timetable table
CREATE TABLE timetable (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number VARCHAR(20),
  academic_year_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id),
  INDEX idx_day (day_of_week)
);

-- ============================================
-- NOTIFICATION TABLES
-- ============================================

-- Announcements table
CREATE TABLE announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  target_audience ENUM('all', 'students', 'teachers', 'parents', 'specific_class') NOT NULL,
  class_id INT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  is_published BOOLEAN DEFAULT FALSE,
  published_by INT,
  publish_date DATETIME,
  expiry_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_target (target_audience),
  INDEX idx_published (is_published),
  INDEX idx_dates (publish_date, expiry_date)
);

-- ============================================
-- FEE MANAGEMENT TABLES
-- ============================================

-- Fee Structure table
CREATE TABLE fee_structure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  fee_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  INDEX idx_class (class_id),
  INDEX idx_academic_year (academic_year_id)
);

-- Fee Payments table
CREATE TABLE fee_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  fee_structure_id INT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('cash', 'card', 'bank_transfer', 'online', 'cheque') NOT NULL,
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE,
  remarks TEXT,
  received_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structure(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_receipt (receipt_number)
);

-- ============================================
-- LIBRARY MANAGEMENT TABLES
-- ============================================

-- Books table
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(100),
  isbn VARCHAR(20) UNIQUE,
  publisher VARCHAR(100),
  publication_year INT,
  category VARCHAR(50),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  shelf_location VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_isbn (isbn),
  INDEX idx_category (category)
);

-- Book Issues table
CREATE TABLE book_issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  book_id INT NOT NULL,
  student_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  fine_amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('issued', 'returned', 'overdue') DEFAULT 'issued',
  issued_by INT,
  returned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (returned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_book (book_id),
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Activity Log table
CREATE TABLE activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);

-- Settings table
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50),
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS (Additional)
-- ============================================

ALTER TABLE departments
ADD FOREIGN KEY (head_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

ALTER TABLE classes
ADD FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default academic year
INSERT INTO academic_years (year, semester, start_date, end_date, is_active)
VALUES ('2025-2026', 'Spring', '2025-01-01', '2025-06-30', TRUE);

-- Insert default exam types
INSERT INTO exam_types (name, code, weightage) VALUES
('Midterm Exam', 'MIDTERM', 30.00),
('Final Exam', 'FINAL', 50.00),
('Quiz', 'QUIZ', 10.00),
('Assignment', 'ASSIGNMENT', 10.00);

-- Insert default departments
INSERT INTO departments (name, code, description) VALUES
('Mathematics', 'MATH', 'Mathematics Department'),
('Science', 'SCI', 'Science Department'),
('Languages', 'LANG', 'Languages Department'),
('Social Studies', 'SS', 'Social Studies Department'),
('Arts', 'ARTS', 'Arts Department');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('school_name', 'ABC High School', 'text', 'Name of the school'),
('school_address', '123 Education Street', 'text', 'School address'),
('school_phone', '+1234567890', 'text', 'School contact number'),
('school_email', 'info@abchighschool.edu', 'email', 'School email address'),
('academic_year_start_month', '9', 'number', 'Month when academic year starts (1-12)'),
('passing_percentage', '40', 'number', 'Minimum passing percentage'),
('max_students_per_class', '40', 'number', 'Maximum students allowed per class'),
('late_fee_per_day', '5.00', 'decimal', 'Late fee charged per day for library books');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Student Full Details
CREATE VIEW vw_student_details AS
SELECT 
  s.id,
  s.admission_number,
  s.roll_number,
  CONCAT(s.first_name, ' ', s.last_name) AS full_name,
  s.email,
  s.phone,
  s.gender,
  s.date_of_birth,
  c.name AS class_name,
  c.grade,
  c.section,
  u.username,
  s.is_active
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN users u ON s.user_id = u.id;

-- View: Teacher Full Details
CREATE VIEW vw_teacher_details AS
SELECT 
  t.id,
  CONCAT(t.first_name, ' ', t.last_name) AS full_name,
  t.email,
  t.phone,
  d.name AS department_name,
  t.qualification,
  u.username,
  t.is_active
FROM teachers t
LEFT JOIN departments d ON t.department_id = d.id
LEFT JOIN users u ON t.user_id = u.id;

-- View: Student Marks Summary
CREATE VIEW vw_student_marks_summary AS
SELECT 
  s.id AS student_id,
  CONCAT(s.first_name, ' ', s.last_name) AS student_name,
  c.name AS class_name,
  sub.name AS subject_name,
  et.name AS exam_type,
  m.marks_obtained,
  m.max_marks,
  (m.marks_obtained / m.max_marks * 100) AS percentage,
  m.grade,
  ay.year AS academic_year,
  ay.semester
FROM marks m
JOIN students s ON m.student_id = s.id
JOIN subjects sub ON m.subject_id = sub.id
JOIN classes c ON m.class_id = c.id
JOIN exam_types et ON m.exam_type_id = et.id
LEFT JOIN academic_years ay ON m.academic_year_id = ay.id;

-- View: Attendance Summary
CREATE VIEW vw_attendance_summary AS
SELECT 
  s.id AS student_id,
  CONCAT(s.first_name, ' ', s.last_name) AS student_name,
  c.name AS class_name,
  COUNT(*) AS total_days,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_days,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_days,
  ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) AS attendance_percentage
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN classes c ON a.class_id = c.id
GROUP BY s.id, c.id;

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure: Calculate Student Rank
CREATE PROCEDURE sp_calculate_student_rank(
  IN p_class_id INT,
  IN p_academic_year_id INT
)
BEGIN
  SELECT 
    s.id AS student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    SUM(m.marks_obtained) AS total_marks,
    ROUND(AVG(m.marks_obtained / m.max_marks * 100), 2) AS average_percentage,
    DENSE_RANK() OVER (ORDER BY SUM(m.marks_obtained) DESC) AS student_rank
  FROM students s
  JOIN marks m ON s.id = m.student_id
  WHERE s.class_id = p_class_id
    AND (p_academic_year_id IS NULL OR m.academic_year_id = p_academic_year_id)
  GROUP BY s.id
  ORDER BY total_marks DESC;
END //

-- Procedure: Get Student Report Card
CREATE PROCEDURE sp_get_student_report(
  IN p_student_id INT,
  IN p_academic_year_id INT
)
BEGIN
  -- Student Info
  SELECT 
    s.id,
    s.admission_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.name AS class_name,
    c.grade,
    ay.year AS academic_year,
    ay.semester
  FROM students s
  LEFT JOIN classes c ON s.class_id = c.id
  LEFT JOIN academic_years ay ON ay.id = p_academic_year_id
  WHERE s.id = p_student_id;
  
  -- Subject-wise Marks
  SELECT 
    sub.name AS subject_name,
    et.name AS exam_type,
    m.marks_obtained,
    m.max_marks,
    ROUND((m.marks_obtained / m.max_marks * 100), 2) AS percentage,
    m.grade
  FROM marks m
  JOIN subjects sub ON m.subject_id = sub.id
  JOIN exam_types et ON m.exam_type_id = et.id
  WHERE m.student_id = p_student_id
    AND (p_academic_year_id IS NULL OR m.academic_year_id = p_academic_year_id)
  ORDER BY sub.name, et.name;
  
  -- Overall Summary
  SELECT 
    SUM(m.marks_obtained) AS total_marks,
    SUM(m.max_marks) AS total_max_marks,
    ROUND(AVG(m.marks_obtained / m.max_marks * 100), 2) AS average_percentage,
    CASE 
      WHEN AVG(m.marks_obtained / m.max_marks * 100) >= 50 THEN 'PASS'
      ELSE 'FAIL'
    END AS status
  FROM marks m
  WHERE m.student_id = p_student_id
    AND (p_academic_year_id IS NULL OR m.academic_year_id = p_academic_year_id);
END //

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER //

-- Trigger: Update available copies when book is issued
CREATE TRIGGER trg_book_issue_after_insert
AFTER INSERT ON book_issues
FOR EACH ROW
BEGIN
  IF NEW.status = 'issued' THEN
    UPDATE books 
    SET available_copies = available_copies - 1 
    WHERE id = NEW.book_id;
  END IF;
END //

-- Trigger: Update available copies when book is returned
CREATE TRIGGER trg_book_issue_after_update
AFTER UPDATE ON book_issues
FOR EACH ROW
BEGIN
  IF OLD.status = 'issued' AND NEW.status = 'returned' THEN
    UPDATE books 
    SET available_copies = available_copies + 1 
    WHERE id = NEW.book_id;
  END IF;
END //

-- Trigger: Log user activity
CREATE TRIGGER trg_user_login_log
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.last_login != OLD.last_login THEN
    INSERT INTO activity_log (user_id, action, description)
    VALUES (NEW.id, 'LOGIN', CONCAT('User logged in at ', NEW.last_login));
  END IF;
END //

DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_marks_student_subject ON marks(student_id, subject_id, academic_year_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_assignments_class_subject ON assignments(class_id, subject_id);
CREATE INDEX idx_teacher_subjects_composite ON teacher_subjects(teacher_id, class_id, academic_year_id);

-- ============================================
-- GRANTS (Optional - for specific users)
-- ============================================

-- Create application user (optional)
-- CREATE USER 'sams_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sams_db.* TO 'sams_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- END OF SCHEMA
-- ============================================
