# B. Requirement Analysis

## Functional Requirements

### 1. User Management

#### 1.1 Authentication and Authorization
- The system SHALL support three user roles: Admin, Teacher, and Student
- The system SHALL authenticate users using username and password credentials
- The system SHALL implement JWT (JSON Web Token) based authentication
- The system SHALL enforce role-based access control for all system features
- The system SHALL track login attempts and lock accounts after 5 failed attempts
- The system SHALL maintain session management with automatic timeout after 30 minutes of inactivity
- The system SHALL allow administrators to unlock locked user accounts

#### 1.2 User Profile Management
- The system SHALL allow users to view and update their profile information
- The system SHALL allow users to change their passwords
- The system SHALL allow users to upload profile photos (JPEG/PNG, max 5MB)
- The system SHALL display user-specific information based on role (student, teacher, admin)

### 2. Student Management

#### 2.1 Student Registration and Records
- The system SHALL allow administrators to create, read, update, and delete student records
- The system SHALL store student information including: first name, last name, email, phone, admission number, roll number, date of birth, gender, blood group, address
- The system SHALL store parent/guardian information including: name, phone, email
- The system SHALL assign unique admission numbers to each student
- The system SHALL assign students to classes
- The system SHALL track student status (active/inactive)
- The system SHALL automatically generate login credentials for new students

#### 2.2 Student Academic Information
- The system SHALL track student enrollment in classes
- The system SHALL maintain student academic year and semester information
- The system SHALL allow students to view their own academic records
- The system SHALL allow students to register for courses/subjects

### 3. Teacher Management

#### 3.1 Teacher Registration and Records
- The system SHALL allow administrators to create, read, update, and delete teacher records
- The system SHALL store teacher information including: first name, last name, email, phone, department, date of birth, hire date, qualification, address, emergency contact
- The system SHALL assign teachers to departments
- The system SHALL track teacher status (active/inactive)
- The system SHALL automatically generate login credentials for new teachers

#### 3.2 Teacher Assignments
- The system SHALL allow administrators to assign teachers to subjects and classes
- The system SHALL allow one teacher to teach multiple subjects across multiple classes
- The system SHALL designate homeroom teachers for classes
- The system SHALL allow teachers to view their assigned classes and subjects
- The system SHALL restrict teachers to only view and manage data for their assigned classes

### 4. Class Management

#### 4.1 Class Configuration
- The system SHALL allow administrators to create, read, update, and delete class records
- The system SHALL store class information including: name, grade, section, academic year, maximum students
- The system SHALL assign homeroom teachers to classes
- The system SHALL track class capacity and current enrollment
- The system SHALL associate classes with academic years and semesters

### 5. Subject Management

#### 5.1 Subject Configuration
- The system SHALL allow administrators to create, read, update, and delete subject records
- The system SHALL store subject information including: name, code, description, maximum marks, passing marks, department, credit hours
- The system SHALL support the following core subjects: Mathematics, English, Biology, Chemistry, Physics
- The system SHALL set maximum marks to 100 for all subjects
- The system SHALL set passing marks to 50% (40 out of 100) for all subjects
- The system SHALL associate subjects with departments

### 6. Marks Management

#### 6.1 Marks Entry and Validation
- The system SHALL allow teachers to enter marks for students in their assigned subjects and classes
- The system SHALL support four exam types: Midterm (30%), Final (50%), Quiz (10%), Assignment (10%)
- The system SHALL validate that marks obtained do not exceed maximum marks (100)
- The system SHALL validate that marks are non-negative numbers
- The system SHALL automatically calculate letter grades based on percentage
- The system SHALL store exam date, remarks, and teacher information with marks
- The system SHALL allow teachers to update marks they have entered

#### 6.2 Grade Calculation
- The system SHALL implement Ethiopian Curriculum Grading System:
  - A (90-100%): Excellent
  - B (80-89.99%): Very Good
  - C (60-79.99%): Good
  - D (50-59.99%): Satisfactory (Minimum Passing Grade)
  - F (0-49.99%): Failure
- The system SHALL calculate weighted total based on exam type weightage
- The system SHALL calculate percentage as (marks_obtained / max_marks) × 100
- The system SHALL determine PASS/FAIL status based on 50% threshold

### 7. Report Generation

#### 7.1 Student Reports
- The system SHALL generate individual student academic reports
- The system SHALL display all marks by subject and exam type
- The system SHALL calculate and display total marks obtained out of total maximum marks
- The system SHALL calculate and display average percentage across all subjects
- The system SHALL calculate and display student rank within their class
- The system SHALL display PASS/FAIL status based on average percentage
- The system SHALL allow students to view only their own reports
- The system SHALL allow teachers to view reports for students in their assigned classes
- The system SHALL allow administrators to view all student reports

#### 7.2 Class Reports
- The system SHALL generate class-wide academic reports
- The system SHALL display all students in a class with their academic performance
- The system SHALL calculate weighted total for each student based on exam weightage
- The system SHALL rank students based on weighted total (highest to lowest)
- The system SHALL display class statistics including: total students, pass count, fail count, class average
- The system SHALL allow filtering by academic year and semester
- The system SHALL restrict teachers to view only their assigned classes
- The system SHALL allow administrators to view all class reports

### 8. Academic Year and Semester Management

#### 8.1 Academic Period Configuration
- The system SHALL allow administrators to create and manage academic years
- The system SHALL store academic year information including: year, semester, start date, end date, active status
- The system SHALL support two semesters per academic year
- The system SHALL allow only one academic year to be active at a time
- The system SHALL associate all academic records with specific academic years

### 9. Department Management

#### 9.1 Department Configuration
- The system SHALL support the following departments: Mathematics, Science, Languages, Social Studies, Arts
- The system SHALL associate subjects with departments
- The system SHALL associate teachers with departments
- The system SHALL allow assignment of department heads

### 10. Security and Access Control

#### 10.1 Data Security
- The system SHALL encrypt user passwords using bcrypt hashing
- The system SHALL implement HTTPS for all data transmission
- The system SHALL validate all user inputs to prevent SQL injection and XSS attacks
- The system SHALL implement CORS (Cross-Origin Resource Sharing) restrictions
- The system SHALL log all authentication attempts

#### 10.2 Access Control
- The system SHALL restrict students to view only their own academic records
- The system SHALL restrict teachers to manage only their assigned classes and subjects
- The system SHALL allow administrators full access to all system features
- The system SHALL implement middleware for authentication and authorization checks
- The system SHALL return appropriate HTTP status codes for unauthorized access attempts

### 11. Real-time Updates

#### 11.1 Live Data Synchronization
- The system SHALL implement Server-Sent Events (SSE) for real-time updates
- The system SHALL broadcast data changes to connected clients
- The system SHALL maintain keep-alive connections for real-time streams
- The system SHALL authenticate real-time connections using JWT tokens

### 12. System Administration

#### 12.1 Administrative Functions
- The system SHALL provide a dashboard for administrators with system statistics
- The system SHALL allow administrators to view locked accounts
- The system SHALL allow administrators to view login attempt history
- The system SHALL allow administrators to generate credentials for students and teachers
- The system SHALL provide health check endpoints for monitoring

### 13. User Interface Requirements

#### 13.1 Dashboard Views
- The system SHALL provide role-specific dashboards for Admin, Teacher, and Student
- The system SHALL display relevant statistics and quick actions on dashboards
- The system SHALL provide navigation to all accessible features based on user role

#### 13.2 Responsive Design
- The system SHALL be accessible on desktop, tablet, and mobile devices
- The system SHALL implement responsive layouts using Tailwind CSS
- The system SHALL provide consistent user experience across devices

### 14. Data Export and Reporting

#### 14.1 Report Export
- The system SHALL allow export of student reports to PDF format
- The system SHALL allow export of class reports to PDF format
- The system SHALL include school branding and formatting in exported reports
