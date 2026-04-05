# Student Academic Record Management System - Database Documentation

## Overview
Complete MySQL database schema for the Student Academic Record Management System (SAMS).

## Database Structure

### Core Tables (8)
1. **users** - Authentication and user accounts
2. **academic_years** - Academic year and semester tracking
3. **departments** - School departments
4. **classes** - Class/grade sections
5. **teachers** - Teacher profiles
6. **students** - Student profiles
7. **subjects** - Subject/course definitions
8. **exam_types** - Types of examinations

### Academic Management (4)
9. **teacher_subjects** - Teacher-subject-class assignments
10. **marks** - Student marks/grades
11. **attendance** - Student attendance records
12. **timetable** - Class schedules

### Assignment Management (2)
13. **assignments** - Assignment definitions
14. **assignment_submissions** - Student submissions

### Communication (1)
15. **announcements** - School announcements

### Fee Management (2)
16. **fee_structure** - Fee definitions
17. **fee_payments** - Payment records

### Library Management (2)
18. **books** - Library book catalog
19. **book_issues** - Book borrowing records

### System Tables (2)
20. **activity_log** - System activity tracking
21. **settings** - System configuration

## Installation

### Prerequisites
- MySQL 5.7+ or MariaDB 10.2+
- Database client (MySQL Workbench, phpMyAdmin, or CLI)

### Setup Steps

1. **Create Database**
```bash
mysql -u root -p < database/schema.sql
```

2. **Verify Installation**
```sql
USE sams_db;
SHOW TABLES;
```

3. **Check Default Data**
```sql
SELECT * FROM users;
SELECT * FROM academic_years;
SELECT * FROM exam_types;
```

## Default Credentials

### Admin Account
- Username: `admin`
- Password: `admin123` (Change in production!)

## Database Features

### Views (4)
- `vw_student_details` - Complete student information
- `vw_teacher_details` - Complete teacher information
- `vw_student_marks_summary` - Student marks with calculations
- `vw_attendance_summary` - Attendance statistics

### Stored Procedures (2)
- `sp_calculate_student_rank` - Calculate class rankings
- `sp_get_student_report` - Generate student report card

### Triggers (3)
- `trg_book_issue_after_insert` - Update book availability on issue
- `trg_book_issue_after_update` - Update book availability on return
- `trg_user_login_log` - Log user login activity

## Table Relationships

### User Management Flow
```
users (authentication)
  ├── teachers (profile)
  └── students (profile)
```

### Academic Structure
```
academic_years
  └── classes
      ├── students (enrolled)
      ├── homeroom_teacher
      └── teacher_subjects
          ├── teacher
          └── subject
```

### Marks & Grading
```
marks
  ├── student
  ├── subject
  ├── class
  ├── exam_type
  └── academic_year
```

### Attendance Tracking
```
attendance
  ├── student
  ├── class
  └── marked_by (teacher)
```

### Assignment Workflow
```
assignments
  ├── teacher (creator)
  ├── subject
  ├── class
  └── assignment_submissions
      ├── student
      └── graded_by (teacher)
```

## Common Queries

### Get All Students in a Class
```sql
SELECT 
  s.id,
  CONCAT(s.first_name, ' ', s.last_name) AS name,
  s.roll_number,
  c.name AS class_name
FROM students s
JOIN classes c ON s.class_id = c.id
WHERE c.id = 1;
```

### Calculate Student Average
```sql
SELECT 
  s.id,
  CONCAT(s.first_name, ' ', s.last_name) AS name,
  AVG(m.marks_obtained / m.max_marks * 100) AS average
FROM students s
JOIN marks m ON s.id = m.student_id
WHERE s.id = 1
GROUP BY s.id;
```

### Get Class Rankings
```sql
CALL sp_calculate_student_rank(1, 1);
```

### Get Student Report Card
```sql
CALL sp_get_student_report(1, 1);
```

### Attendance Percentage
```sql
SELECT * FROM vw_attendance_summary
WHERE student_id = 1;
```

### Teacher's Classes
```sql
SELECT DISTINCT
  c.id,
  c.name,
  c.grade,
  c.section,
  sub.name AS subject
FROM teacher_subjects ts
JOIN classes c ON ts.class_id = c.id
JOIN subjects sub ON ts.subject_id = sub.id
WHERE ts.teacher_id = 1;
```

## Indexes

### Performance Indexes
- All foreign keys are indexed
- Common search fields (username, email, roll_number)
- Date fields for time-based queries
- Composite indexes for complex queries

## Security Considerations

### Password Storage
- Passwords should be hashed using bcrypt
- Default admin password must be changed
- Implement password complexity requirements

### Access Control
- Use separate database users for different access levels
- Grant minimum required privileges
- Enable MySQL audit logging

### Data Protection
- Regular backups (daily recommended)
- Encrypt sensitive data (personal information)
- Implement row-level security where needed

## Backup & Restore

### Backup Database
```bash
mysqldump -u root -p sams_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u root -p sams_db < backup_20250101.sql
```

### Backup Specific Tables
```bash
mysqldump -u root -p sams_db students teachers marks > critical_data.sql
```

## Maintenance

### Optimize Tables
```sql
OPTIMIZE TABLE students, teachers, marks, attendance;
```

### Check Table Status
```sql
SHOW TABLE STATUS FROM sams_db;
```

### Analyze Query Performance
```sql
EXPLAIN SELECT * FROM marks WHERE student_id = 1;
```

## Migration Guide

### Adding New Columns
```sql
ALTER TABLE students 
ADD COLUMN nationality VARCHAR(50) AFTER gender;
```

### Adding New Tables
```sql
CREATE TABLE student_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  document_type VARCHAR(50),
  file_path VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

## Data Dictionary

### User Roles
- `admin` - Full system access
- `teacher` - Teaching and grading functions
- `student` - View own records

### Exam Types
- `MIDTERM` - Mid-semester examination
- `FINAL` - End-semester examination
- `QUIZ` - Short assessments
- `ASSIGNMENT` - Take-home assignments

### Attendance Status
- `present` - Student attended
- `absent` - Student did not attend
- `late` - Student arrived late
- `excused` - Excused absence

### Assignment Status
- `pending` - Not yet submitted
- `submitted` - Submitted, awaiting grading
- `graded` - Graded by teacher
- `late` - Submitted after deadline

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Ensure parent records exist before inserting child records
   - Check cascade delete settings

2. **Duplicate Entry Errors**
   - Check unique constraints (username, email, admission_number)
   - Use INSERT IGNORE or ON DUPLICATE KEY UPDATE

3. **Performance Issues**
   - Add indexes on frequently queried columns
   - Use EXPLAIN to analyze slow queries
   - Consider partitioning large tables

## Support

For database-related issues:
1. Check error logs: `/var/log/mysql/error.log`
2. Review slow query log
3. Verify table integrity: `CHECK TABLE table_name`
4. Repair if needed: `REPAIR TABLE table_name`

## Version History

- **v1.0** - Initial schema with core functionality
- Includes: Users, Students, Teachers, Marks, Attendance, Assignments
- Features: Views, Stored Procedures, Triggers
