# C. System Design

## Entity-Relationship (ER) Diagram

### ER Diagram Description

The Student Academic Record Management System consists of 13 core entities with well-defined relationships. The system follows a normalized database design to ensure data integrity and minimize redundancy.

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ PK: id          │
│ username        │
│ password        │
│ role            │
│ is_active       │
│ last_login      │
└────────┬────────┘
         │
         │ 1:1
         │
    ┌────┴────┬──────────────┬────────────┐
    │         │              │            │
    ▼         ▼              ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│TEACHERS│ │ STUDENTS │ │  ADMIN   │ │USER_PROFILES │
└────────┘ └──────────┘ └──────────┘ └──────────────┘

┌─────────────────────┐         ┌──────────────────┐
│    DEPARTMENTS      │◄────────│    TEACHERS      │
│─────────────────────│  N:1    │──────────────────│
│ PK: id              │         │ PK: id           │
│ name                │         │ FK: user_id      │
│ code                │         │ FK: department_id│
│ FK: head_teacher_id │         │ first_name       │
└─────────────────────┘         │ last_name        │
         │                      │ email            │
         │ 1:N                  │ phone            │
         ▼                      │ hire_date        │
┌─────────────────────┐         │ qualification    │
│     SUBJECTS        │         └────────┬─────────┘
│─────────────────────│                  │
│ PK: id              │                  │ N:M
│ name                │                  │
│ code                │         ┌────────▼─────────┐
│ max_marks           │         │TEACHER_SUBJECTS  │
│ passing_marks       │◄────────│──────────────────│
│ FK: department_id   │  N:1    │ PK: id           │
│ credit_hours        │         │ FK: teacher_id   │
└──────────┬──────────┘         │ FK: subject_id   │
           │                    │ FK: class_id     │
           │ 1:N                │ FK: academic_year│
           │                    └──────────────────┘
           │
           │         ┌──────────────────┐
           │         │    CLASSES       │
           │         │──────────────────│
           │         │ PK: id           │
           │         │ name             │
           │         │ grade            │
           │         │ section          │
           │         │ FK: academic_year│
           │         │ FK: homeroom_tchr│
           │         │ max_students     │
           │         └────────┬─────────┘
           │                  │
           │                  │ 1:N
           │                  │
           │         ┌────────▼─────────┐
           │         │    STUDENTS      │
           │         │──────────────────│
           │         │ PK: id           │
           │         │ FK: user_id      │
           │         │ FK: class_id     │
           │         │ admission_number │
           │         │ roll_number      │
           │         │ first_name       │
           │         │ last_name        │
           │         │ gender           │
           │         │ date_of_birth    │
           │         └────────┬─────────┘
           │                  │
           │                  │ 1:N
           │                  │
           │         ┌────────▼─────────┐
           └─────────►     MARKS        │
                     │──────────────────│
                     │ PK: id           │
                     │ FK: student_id   │
                     │ FK: subject_id   │
                     │ FK: class_id     │
                     │ FK: exam_type_id │
                     │ FK: academic_year│
                     │ FK: teacher_id   │
                     │ marks_obtained   │
                     │ max_marks        │
                     │ grade            │
                     │ exam_date        │
                     └──────────────────┘
                              ▲
                              │ N:1
                              │
                     ┌────────┴─────────┐
                     │   EXAM_TYPES     │
                     │──────────────────│
                     │ PK: id           │
                     │ name             │
                     │ code             │
                     │ weightage        │
                     └──────────────────┘

┌──────────────────────┐
│  ACADEMIC_YEARS      │
│──────────────────────│
│ PK: id               │
│ year                 │
│ semester             │
│ start_date           │
│ end_date             │
│ is_active            │
└──────────────────────┘
         │
         │ 1:N (Referenced by multiple tables)
         │
         └──► classes, marks, teacher_subjects, course_registrations

┌──────────────────────────┐
│  COURSE_REGISTRATIONS    │
│──────────────────────────│
│ PK: id                   │
│ FK: student_id           │
│ FK: subject_id           │
│ FK: academic_year_id     │
│ status                   │
└──────────────────────────┘
```


## Entity Descriptions

### 1. USERS
**Purpose**: Central authentication table for all system users

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each user
- `username` (VARCHAR(50), UNIQUE, NOT NULL): Login username
- `password` (VARCHAR(255), NOT NULL): Bcrypt hashed password
- `role` (VARCHAR(20), NOT NULL): User role (admin, teacher, student)
- `is_active` (BOOLEAN): Account status flag
- `last_login` (TIMESTAMPTZ): Last successful login timestamp
- `created_at` (TIMESTAMPTZ): Account creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints**:
- CHECK: role IN ('admin', 'teacher', 'student')
- UNIQUE: username

### 2. TEACHERS
**Purpose**: Store teacher personal and professional information

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each teacher
- `user_id` (BIGINT, FK, UNIQUE, NOT NULL): Reference to users table
- `first_name` (VARCHAR(50), NOT NULL): Teacher's first name
- `last_name` (VARCHAR(50), NOT NULL): Teacher's last name
- `email` (VARCHAR(100), UNIQUE): Teacher's email address
- `phone` (VARCHAR(20)): Contact phone number
- `department_id` (BIGINT, FK): Reference to departments table
- `date_of_birth` (DATE): Teacher's date of birth
- `hire_date` (DATE): Employment start date
- `qualification` (VARCHAR(100)): Academic qualifications
- `address` (TEXT): Residential address
- `emergency_contact` (VARCHAR(100)): Emergency contact person
- `emergency_phone` (VARCHAR(20)): Emergency contact number
- `profile_photo` (VARCHAR(255)): Profile photo URL
- `is_active` (BOOLEAN): Employment status
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Relationships**:
- 1:1 with USERS (user_id)
- N:1 with DEPARTMENTS (department_id)
- 1:N with TEACHER_SUBJECTS
- 1:N with CLASSES (as homeroom teacher)
- 1:N with MARKS (as grading teacher)

### 3. STUDENTS
**Purpose**: Store student personal and academic information

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each student
- `user_id` (BIGINT, FK, UNIQUE, NOT NULL): Reference to users table
- `first_name` (VARCHAR(50), NOT NULL): Student's first name
- `last_name` (VARCHAR(50), NOT NULL): Student's last name
- `email` (VARCHAR(100)): Student's email address
- `phone` (VARCHAR(20)): Contact phone number
- `class_id` (BIGINT, FK): Reference to classes table
- `roll_number` (VARCHAR(20)): Class roll number
- `admission_number` (VARCHAR(50), UNIQUE): Unique admission identifier
- `date_of_birth` (DATE): Student's date of birth
- `gender` (VARCHAR(10)): Student's gender
- `blood_group` (VARCHAR(5)): Blood group information
- `address` (TEXT): Residential address
- `parent_guardian_name` (VARCHAR(100)): Parent/guardian name
- `parent_guardian_phone` (VARCHAR(20)): Parent/guardian phone
- `parent_guardian_email` (VARCHAR(100)): Parent/guardian email
- `emergency_contact` (VARCHAR(100)): Emergency contact person
- `emergency_phone` (VARCHAR(20)): Emergency contact number
- `admission_date` (DATE): Date of admission
- `profile_photo` (VARCHAR(255)): Profile photo URL
- `is_active` (BOOLEAN): Enrollment status
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints**:
- CHECK: gender IN ('Male', 'Female', 'Other')
- UNIQUE: admission_number

**Relationships**:
- 1:1 with USERS (user_id)
- N:1 with CLASSES (class_id)
- 1:N with MARKS
- 1:N with COURSE_REGISTRATIONS

### 4. CLASSES
**Purpose**: Organize students into academic groups

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each class
- `name` (VARCHAR(50), NOT NULL): Class name (e.g., "Grade 10 A")
- `grade` (VARCHAR(20), NOT NULL): Grade level (e.g., "10")
- `section` (VARCHAR(10)): Section identifier (e.g., "A")
- `academic_year_id` (BIGINT, FK): Reference to academic_years table
- `homeroom_teacher_id` (BIGINT, FK): Reference to teachers table
- `max_students` (INT): Maximum class capacity (default: 40)
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Relationships**:
- N:1 with ACADEMIC_YEARS (academic_year_id)
- N:1 with TEACHERS (homeroom_teacher_id)
- 1:N with STUDENTS
- 1:N with TEACHER_SUBJECTS
- 1:N with MARKS

### 5. SUBJECTS
**Purpose**: Define academic subjects/courses

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each subject
- `name` (VARCHAR(100), NOT NULL): Subject name (e.g., "Mathematics")
- `code` (VARCHAR(20), UNIQUE, NOT NULL): Subject code (e.g., "MATH101")
- `description` (TEXT): Subject description
- `max_marks` (INT): Maximum marks (default: 100)
- `passing_marks` (INT): Minimum passing marks (default: 40)
- `department_id` (BIGINT, FK): Reference to departments table
- `credit_hours` (INT): Credit hours (default: 3)
- `is_active` (BOOLEAN): Subject status
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Constraints**:
- UNIQUE: code

**Relationships**:
- N:1 with DEPARTMENTS (department_id)
- 1:N with TEACHER_SUBJECTS
- 1:N with MARKS
- 1:N with COURSE_REGISTRATIONS

### 6. DEPARTMENTS
**Purpose**: Organize subjects and teachers by academic department

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each department
- `name` (VARCHAR(100), NOT NULL): Department name
- `code` (VARCHAR(20), UNIQUE, NOT NULL): Department code
- `description` (TEXT): Department description
- `head_teacher_id` (BIGINT, FK): Reference to teachers table
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Constraints**:
- UNIQUE: code

**Relationships**:
- 1:N with TEACHERS
- 1:N with SUBJECTS
- N:1 with TEACHERS (head_teacher_id)

### 7. TEACHER_SUBJECTS
**Purpose**: Map teachers to subjects and classes (teaching assignments)

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each assignment
- `teacher_id` (BIGINT, FK, NOT NULL): Reference to teachers table
- `subject_id` (BIGINT, FK, NOT NULL): Reference to subjects table
- `class_id` (BIGINT, FK, NOT NULL): Reference to classes table
- `academic_year_id` (BIGINT, FK): Reference to academic_years table
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Constraints**:
- UNIQUE: (teacher_id, subject_id, class_id, academic_year_id)

**Relationships**:
- N:1 with TEACHERS (teacher_id)
- N:1 with SUBJECTS (subject_id)
- N:1 with CLASSES (class_id)
- N:1 with ACADEMIC_YEARS (academic_year_id)

### 8. MARKS
**Purpose**: Store student examination marks and grades

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each mark entry
- `student_id` (BIGINT, FK, NOT NULL): Reference to students table
- `subject_id` (BIGINT, FK, NOT NULL): Reference to subjects table
- `class_id` (BIGINT, FK, NOT NULL): Reference to classes table
- `exam_type_id` (BIGINT, FK, NOT NULL): Reference to exam_types table
- `academic_year_id` (BIGINT, FK): Reference to academic_years table
- `marks_obtained` (NUMERIC(5,2), NOT NULL): Marks scored by student
- `max_marks` (INT, NOT NULL): Maximum possible marks
- `grade` (VARCHAR(5)): Letter grade (A, B, C, D, F)
- `remarks` (TEXT): Teacher's remarks
- `teacher_id` (BIGINT, FK): Reference to teachers table (grading teacher)
- `exam_date` (DATE): Date of examination
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Relationships**:
- N:1 with STUDENTS (student_id)
- N:1 with SUBJECTS (subject_id)
- N:1 with CLASSES (class_id)
- N:1 with EXAM_TYPES (exam_type_id)
- N:1 with ACADEMIC_YEARS (academic_year_id)
- N:1 with TEACHERS (teacher_id)

### 9. EXAM_TYPES
**Purpose**: Define types of examinations and their weightage

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each exam type
- `name` (VARCHAR(50), NOT NULL): Exam type name (e.g., "Midterm Exam")
- `code` (VARCHAR(20), UNIQUE, NOT NULL): Exam type code (e.g., "MIDTERM")
- `description` (TEXT): Exam type description
- `weightage` (NUMERIC(5,2)): Percentage weightage (default: 100.00)
- `is_active` (BOOLEAN): Exam type status
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Constraints**:
- UNIQUE: code

**Relationships**:
- 1:N with MARKS

**Predefined Values**:
- Midterm Exam (MIDTERM): 30% weightage
- Final Exam (FINAL): 50% weightage
- Quiz (QUIZ): 10% weightage
- Assignment (ASSIGNMENT): 10% weightage

### 10. ACADEMIC_YEARS
**Purpose**: Define academic periods (years and semesters)

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each academic year
- `year` (VARCHAR(20), NOT NULL): Academic year (e.g., "2025-2026")
- `semester` (VARCHAR(20), NOT NULL): Semester number ("1" or "2")
- `start_date` (DATE, NOT NULL): Semester start date
- `end_date` (DATE, NOT NULL): Semester end date
- `is_active` (BOOLEAN): Active status (only one can be active)
- `created_at` (TIMESTAMPTZ): Record creation timestamp

**Constraints**:
- CHECK: semester IN ('1', '2')
- UNIQUE: (year, semester)

**Relationships**:
- 1:N with CLASSES
- 1:N with MARKS
- 1:N with TEACHER_SUBJECTS
- 1:N with COURSE_REGISTRATIONS

### 11. USER_PROFILES
**Purpose**: Store additional user profile information

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each profile
- `user_id` (BIGINT, FK, UNIQUE, NOT NULL): Reference to users table
- `full_name` (VARCHAR(120)): User's full name
- `email` (VARCHAR(120)): User's email address
- `phone` (VARCHAR(30)): Contact phone number
- `profile_photo` (VARCHAR(255)): Profile photo URL
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Relationships**:
- 1:1 with USERS (user_id)

### 12. COURSE_REGISTRATIONS
**Purpose**: Track student course/subject registrations

**Attributes**:
- `id` (BIGINT, PK): Unique identifier for each registration
- `student_id` (BIGINT, FK, NOT NULL): Reference to students table
- `subject_id` (BIGINT, FK, NOT NULL): Reference to subjects table
- `academic_year_id` (BIGINT, FK, NOT NULL): Reference to academic_years table
- `status` (VARCHAR(20), NOT NULL): Registration status
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

**Constraints**:
- CHECK: status IN ('pending', 'approved', 'rejected')
- UNIQUE: (student_id, subject_id, academic_year_id)
- DEFAULT: status = 'pending'

**Relationships**:
- N:1 with STUDENTS (student_id)
- N:1 with SUBJECTS (subject_id)
- N:1 with ACADEMIC_YEARS (academic_year_id)

## Key Relationships Summary

### One-to-One (1:1)
- USERS ↔ TEACHERS
- USERS ↔ STUDENTS
- USERS ↔ USER_PROFILES

### One-to-Many (1:N)
- DEPARTMENTS → TEACHERS
- DEPARTMENTS → SUBJECTS
- CLASSES → STUDENTS
- TEACHERS → MARKS (as grading teacher)
- STUDENTS → MARKS
- SUBJECTS → MARKS
- EXAM_TYPES → MARKS
- ACADEMIC_YEARS → CLASSES
- ACADEMIC_YEARS → MARKS
- ACADEMIC_YEARS → TEACHER_SUBJECTS
- ACADEMIC_YEARS → COURSE_REGISTRATIONS

### Many-to-Many (M:N)
- TEACHERS ↔ SUBJECTS ↔ CLASSES (through TEACHER_SUBJECTS)
- STUDENTS ↔ SUBJECTS (through COURSE_REGISTRATIONS)

## Cardinality Constraints

1. Each USER must have exactly one role (admin, teacher, or student)
2. Each TEACHER must be associated with exactly one USER
3. Each STUDENT must be associated with exactly one USER
4. Each CLASS can have at most one HOMEROOM_TEACHER
5. Each STUDENT can be enrolled in at most one CLASS at a time
6. Each MARK entry must reference exactly one STUDENT, SUBJECT, CLASS, and EXAM_TYPE
7. Each TEACHER can teach multiple SUBJECTS across multiple CLASSES
8. Each SUBJECT can be taught by multiple TEACHERS in different CLASSES
9. Only one ACADEMIC_YEAR can be active at any given time
