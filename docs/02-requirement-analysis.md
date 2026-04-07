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
