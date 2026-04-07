# D. Database Design

## Relational Schema

The database schema is implemented in PostgreSQL and follows third normal form (3NF) to ensure data integrity and minimize redundancy.

### Schema Notation

```
TABLE_NAME (
  PK: Primary Key
  FK: Foreign Key
  UK: Unique Key
  NN: Not Null
)
```

### Complete Relational Schema

#### 1. USERS
```
users (
  id BIGINT PK,
  username VARCHAR(50) UK NN,
  password VARCHAR(255) NN,
  role VARCHAR(20) NN CHECK(role IN ('admin','teacher','student')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. TEACHERS
```
teachers (
  id BIGINT PK,
  user_id BIGINT FK(users.id) UK NN ON DELETE CASCADE,
  first_name VARCHAR(50) NN,
  last_name VARCHAR(50) NN,
  email VARCHAR(100) UK,
  phone VARCHAR(20),
  department_id BIGINT FK(departments.id) ON DELETE SET NULL,
  date_of_birth DATE,
  hire_date DATE,
  qualification VARCHAR(100),
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  profile_photo VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 3. STUDENTS
```
students (
  id BIGINT PK,
  user_id BIGINT FK(users.id) UK NN ON DELETE CASCADE,
  first_name VARCHAR(50) NN,
  last_name VARCHAR(50) NN,
  email VARCHAR(100),
  phone VARCHAR(20),
  class_id BIGINT FK(classes.id) ON DELETE SET NULL,
  roll_number VARCHAR(20),
  admission_number VARCHAR(50) UK,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK(gender IN ('Male','Female','Other')),
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 4. CLASSES
```
classes (
  id BIGINT PK,
  name VARCHAR(50) NN,
  grade VARCHAR(20) NN,
  section VARCHAR(10),
  academic_year_id BIGINT FK(academic_years.id) ON DELETE SET NULL,
  homeroom_teacher_id BIGINT FK(teachers.id) ON DELETE SET NULL,
  max_students INT DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 5. SUBJECTS
```
subjects (
  id BIGINT PK,
  name VARCHAR(100) NN,
  code VARCHAR(20) UK NN,
  description TEXT,
  max_marks INT DEFAULT 100,
  passing_marks INT DEFAULT 40,
  department_id BIGINT FK(departments.id) ON DELETE SET NULL,
  credit_hours INT DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 6. DEPARTMENTS
```
departments (
  id BIGINT PK,
  name VARCHAR(100) NN,
  code VARCHAR(20) UK NN,
  description TEXT,
  head_teacher_id BIGINT FK(teachers.id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 7. TEACHER_SUBJECTS
```
teacher_subjects (
  id BIGINT PK,
  teacher_id BIGINT FK(teachers.id) NN ON DELETE CASCADE,
  subject_id BIGINT FK(subjects.id) NN ON DELETE CASCADE,
  class_id BIGINT FK(classes.id) NN ON DELETE CASCADE,
  academic_year_id BIGINT FK(academic_years.id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(teacher_id, subject_id, class_id, academic_year_id)
)
```

#### 8. MARKS
```
marks (
  id BIGINT PK,
  student_id BIGINT FK(students.id) NN ON DELETE CASCADE,
  subject_id BIGINT FK(subjects.id) NN ON DELETE CASCADE,
  class_id BIGINT FK(classes.id) NN ON DELETE CASCADE,
  exam_type_id BIGINT FK(exam_types.id) NN ON DELETE CASCADE,
  academic_year_id BIGINT FK(academic_years.id) ON DELETE SET NULL,
  marks_obtained NUMERIC(5,2) NN,
  max_marks INT NN,
  grade VARCHAR(5),
  remarks TEXT,
  teacher_id BIGINT FK(teachers.id) ON DELETE SET NULL,
  exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 9. EXAM_TYPES
```
exam_types (
  id BIGINT PK,
  name VARCHAR(50) NN,
  code VARCHAR(20) UK NN,
  description TEXT,
  weightage NUMERIC(5,2) DEFAULT 100.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 10. ACADEMIC_YEARS
```
academic_years (
  id BIGINT PK,
  year VARCHAR(20) NN,
  semester VARCHAR(20) NN CHECK(semester IN ('1','2')),
  start_date DATE NN,
  end_date DATE NN,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, semester)
)
```

#### 11. USER_PROFILES
```
user_profiles (
  id BIGINT PK,
  user_id BIGINT FK(users.id) UK NN ON DELETE CASCADE,
  full_name VARCHAR(120),
  email VARCHAR(120),
  phone VARCHAR(30),
  profile_photo VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
```

#### 12. COURSE_REGISTRATIONS
```
course_registrations (
  id BIGINT PK,
  student_id BIGINT FK(students.id) NN ON DELETE CASCADE,
  subject_id BIGINT FK(subjects.id) NN ON DELETE CASCADE,
  academic_year_id BIGINT FK(academic_years.id) NN ON DELETE CASCADE,
  status VARCHAR(20) NN DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, subject_id, academic_year_id)
)
```


## Primary Keys

All tables use auto-incrementing BIGINT as primary keys for scalability and performance.

| Table | Primary Key | Type | Generation Strategy |
|-------|-------------|------|---------------------|
| users | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| teachers | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| students | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| classes | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| subjects | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| departments | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| teacher_subjects | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| marks | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| exam_types | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| academic_years | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| user_profiles | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |
| course_registrations | id | BIGINT | GENERATED BY DEFAULT AS IDENTITY |

### Primary Key Characteristics

- **Auto-incrementing**: All primary keys are automatically generated
- **BIGINT type**: Supports up to 9,223,372,036,854,775,807 records
- **Indexed**: Primary keys are automatically indexed for fast lookups
- **Non-nullable**: All primary keys are NOT NULL by default

## Foreign Keys

Foreign keys enforce referential integrity and define relationships between tables.

### Foreign Key Relationships

#### TEACHERS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| user_id | users(id) | CASCADE | Link to user account |
| department_id | departments(id) | SET NULL | Department assignment |

#### STUDENTS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| user_id | users(id) | CASCADE | Link to user account |
| class_id | classes(id) | SET NULL | Class enrollment |

#### CLASSES Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| academic_year_id | academic_years(id) | SET NULL | Academic period |
| homeroom_teacher_id | teachers(id) | SET NULL | Homeroom teacher assignment |

#### SUBJECTS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| department_id | departments(id) | SET NULL | Department categorization |

#### DEPARTMENTS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| head_teacher_id | teachers(id) | SET NULL | Department head assignment |

#### TEACHER_SUBJECTS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| teacher_id | teachers(id) | CASCADE | Teacher assignment |
| subject_id | subjects(id) | CASCADE | Subject assignment |
| class_id | classes(id) | CASCADE | Class assignment |
| academic_year_id | academic_years(id) | SET NULL | Academic period |

#### MARKS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| student_id | students(id) | CASCADE | Student identification |
| subject_id | subjects(id) | CASCADE | Subject identification |
| class_id | classes(id) | CASCADE | Class identification |
| exam_type_id | exam_types(id) | CASCADE | Exam type identification |
| academic_year_id | academic_years(id) | SET NULL | Academic period |
| teacher_id | teachers(id) | SET NULL | Grading teacher |

#### USER_PROFILES Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| user_id | users(id) | CASCADE | Link to user account |

#### COURSE_REGISTRATIONS Table
| Foreign Key | References | On Delete Action | Purpose |
|-------------|------------|------------------|---------|
| student_id | students(id) | CASCADE | Student identification |
| subject_id | subjects(id) | CASCADE | Subject identification |
| academic_year_id | academic_years(id) | CASCADE | Academic period |

### Foreign Key Delete Actions

**CASCADE**: When parent record is deleted, child records are automatically deleted
- Used for: user_id in teachers/students (delete user → delete profile)
- Used for: marks, teacher_subjects (delete parent → delete dependent records)

**SET NULL**: When parent record is deleted, foreign key is set to NULL
- Used for: optional relationships (department_id, class_id, academic_year_id)
- Preserves historical data while removing broken references

## Constraints

### Check Constraints

#### USERS Table
```sql
CHECK (role IN ('admin', 'teacher', 'student'))
```
Ensures only valid user roles are stored.

#### STUDENTS Table
```sql
CHECK (gender IN ('Male', 'Female', 'Other'))
```
Ensures only valid gender values are stored.

#### ACADEMIC_YEARS Table
```sql
CHECK (semester IN ('1', '2'))
```
Ensures only valid semester values (1 or 2) are stored.

#### COURSE_REGISTRATIONS Table
```sql
CHECK (status IN ('pending', 'approved', 'rejected'))
```
Ensures only valid registration statuses are stored.

### Unique Constraints

#### Single Column Unique Constraints
| Table | Column | Purpose |
|-------|--------|---------|
| users | username | Prevent duplicate usernames |
| teachers | user_id | One teacher per user account |
| teachers | email | Unique teacher email addresses |
| students | user_id | One student per user account |
| students | admission_number | Unique student admission numbers |
| subjects | code | Unique subject codes |
| departments | code | Unique department codes |
| exam_types | code | Unique exam type codes |
| user_profiles | user_id | One profile per user |

#### Composite Unique Constraints
| Table | Columns | Purpose |
|-------|---------|---------|
| academic_years | (year, semester) | Prevent duplicate academic periods |
| teacher_subjects | (teacher_id, subject_id, class_id, academic_year_id) | Prevent duplicate teaching assignments |
| course_registrations | (student_id, subject_id, academic_year_id) | Prevent duplicate course registrations |

### Not Null Constraints

#### Critical NOT NULL Fields
- **users**: username, password, role
- **teachers**: user_id, first_name, last_name
- **students**: user_id, first_name, last_name
- **classes**: name, grade
- **subjects**: name, code
- **departments**: name, code
- **teacher_subjects**: teacher_id, subject_id, class_id
- **marks**: student_id, subject_id, class_id, exam_type_id, marks_obtained, max_marks
- **exam_types**: name, code
- **academic_years**: year, semester, start_date, end_date
- **user_profiles**: user_id
- **course_registrations**: student_id, subject_id, academic_year_id, status

### Default Value Constraints

| Table | Column | Default Value | Purpose |
|-------|--------|---------------|---------|
| users | is_active | TRUE | New users are active by default |
| users | created_at | CURRENT_TIMESTAMP | Auto-timestamp creation |
| users | updated_at | CURRENT_TIMESTAMP | Auto-timestamp updates |
| teachers | is_active | TRUE | New teachers are active |
| students | is_active | TRUE | New students are active |
| classes | max_students | 40 | Standard class capacity |
| subjects | max_marks | 100 | Standard maximum marks |
| subjects | passing_marks | 40 | 40% passing threshold |
| subjects | credit_hours | 3 | Standard credit hours |
| subjects | is_active | TRUE | New subjects are active |
| exam_types | weightage | 100.00 | Default weightage |
| exam_types | is_active | TRUE | New exam types are active |
| academic_years | is_active | FALSE | Must be explicitly activated |
| course_registrations | status | 'pending' | New registrations pending approval |

## Database Indexes

Indexes are created to optimize query performance for frequently accessed data.

### Primary Key Indexes (Automatic)
All primary keys are automatically indexed by PostgreSQL.

### Foreign Key Indexes
```sql
CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_teachers_name ON teachers(last_name, first_name);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_name ON students(last_name, first_name);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_teacher_subjects_teacher ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_class ON teacher_subjects(class_id);
CREATE INDEX idx_marks_student_subject ON marks(student_id, subject_id, academic_year_id);
CREATE INDEX idx_marks_class ON marks(class_id);
CREATE INDEX idx_marks_exam_type ON marks(exam_type_id);
CREATE INDEX idx_course_reg_student ON course_registrations(student_id);
```

### Composite Indexes
```sql
CREATE INDEX idx_teacher_subjects_composite 
  ON teacher_subjects(teacher_id, class_id, academic_year_id);
```

### Unique Indexes (Automatic)
All UNIQUE constraints automatically create indexes:
- users(username)
- teachers(email)
- students(admission_number)
- subjects(code)
- departments(code)
- exam_types(code)

### Index Benefits

1. **Faster Lookups**: Primary and foreign key indexes speed up JOIN operations
2. **Efficient Filtering**: Indexes on frequently filtered columns (class_id, academic_year_id)
3. **Optimized Sorting**: Name indexes support ORDER BY operations
4. **Unique Enforcement**: Unique indexes prevent duplicate entries
5. **Composite Queries**: Multi-column indexes optimize complex WHERE clauses

## Referential Integrity Rules

### Cascade Delete Rules
1. Delete USER → Cascade delete TEACHER/STUDENT/USER_PROFILE
2. Delete TEACHER → Cascade delete TEACHER_SUBJECTS
3. Delete STUDENT → Cascade delete MARKS and COURSE_REGISTRATIONS
4. Delete SUBJECT → Cascade delete MARKS and TEACHER_SUBJECTS
5. Delete CLASS → Cascade delete MARKS and TEACHER_SUBJECTS
6. Delete EXAM_TYPE → Cascade delete MARKS

### Set Null Rules
1. Delete DEPARTMENT → Set NULL in teachers.department_id and subjects.department_id
2. Delete TEACHER (homeroom) → Set NULL in classes.homeroom_teacher_id
3. Delete TEACHER (head) → Set NULL in departments.head_teacher_id
4. Delete CLASS → Set NULL in students.class_id
5. Delete ACADEMIC_YEAR → Set NULL in related tables (preserves historical data)

### Data Integrity Guarantees

1. **No Orphaned Records**: CASCADE ensures dependent records are removed
2. **Historical Preservation**: SET NULL maintains records when optional references are deleted
3. **Consistent State**: CHECK constraints ensure only valid data is stored
4. **Unique Identification**: UNIQUE constraints prevent duplicate entries
5. **Required Data**: NOT NULL constraints ensure critical fields are populated
6. **Type Safety**: Data types enforce valid value ranges
