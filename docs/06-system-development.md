# F. System Development

## Development Tools and Technology Stack

### 1. Frontend Technologies

#### 1.1 Core Framework
- **React 18.3.1**: Modern JavaScript library for building user interfaces
  - Component-based architecture
  - Virtual DOM for efficient rendering
  - Hooks for state management (useState, useEffect, useContext)
  - Context API for global state management

#### 1.2 Build Tool
- **Vite 6.3.5**: Next-generation frontend build tool
  - Lightning-fast Hot Module Replacement (HMR)
  - Optimized production builds
  - Native ES modules support
  - Plugin ecosystem

#### 1.3 Routing
- **React Router 7.13.0**: Declarative routing for React applications
  - Client-side routing
  - Protected routes for authentication
  - Role-based route access control
  - Nested routing support

#### 1.4 Styling
- **Tailwind CSS 4.1.12**: Utility-first CSS framework
  - Responsive design utilities
  - Custom color schemes
  - Component variants
  - Dark mode support (if implemented)
- **@tailwindcss/vite 4.1.12**: Vite plugin for Tailwind CSS
- **tw-animate-css 1.3.8**: Animation utilities

#### 1.5 UI Components
- **Lucide React 0.487.0**: Icon library with 1000+ icons
- **Recharts 2.15.2**: Composable charting library for data visualization
- **Custom UI Components**: Built with Radix UI primitives
  - Button, Input, Select, Dialog, Alert Dialog
  - Table, Tabs, Dropdown Menu, Avatar
  - Card, Badge, Checkbox, Label, Textarea

#### 1.6 Utilities
- **class-variance-authority 0.7.1**: Type-safe component variants
- **clsx 2.1.1**: Utility for constructing className strings
- **tailwind-merge 3.2.0**: Merge Tailwind CSS classes without conflicts

#### 1.7 PDF Generation
- **html2canvas 1.4.1**: Screenshot library for HTML elements
- **jsPDF 4.2.1**: PDF generation library for client-side PDF creation

### 2. Backend Technologies

#### 2.1 Runtime and Framework
- **Node.js**: JavaScript runtime environment
- **Express 4.18.2**: Fast, unopinionated web framework
  - RESTful API architecture
  - Middleware support
  - Route handling
  - Error handling

#### 2.2 Database
- **PostgreSQL**: Advanced open-source relational database
  - ACID compliance
  - Complex queries support
  - JSON data type support
  - Full-text search capabilities
- **Supabase**: PostgreSQL hosting platform
  - Managed database service
  - Automatic backups
  - Connection pooling
  - Real-time subscriptions
- **pg 8.20.0**: PostgreSQL client for Node.js

#### 2.3 Authentication and Security
- **jsonwebtoken 9.0.2**: JWT implementation for Node.js
  - Token-based authentication
  - Stateless sessions
  - Role-based access control
- **bcrypt 5.1.1**: Password hashing library
  - Salted password hashing
  - Configurable cost factor
  - Secure password storage

#### 2.4 Middleware and Utilities
- **cors 2.8.5**: Cross-Origin Resource Sharing middleware
- **dotenv 16.3.1**: Environment variable management
- **multer 2.1.1**: Multipart/form-data handling for file uploads

#### 2.5 Development Tools
- **nodemon 3.0.2**: Auto-restart server on file changes

### 3. Database Design Tools

#### 3.1 Schema Design
- **PostgreSQL**: Native SQL for schema definition
- **Database Migrations**: SQL scripts for version control
- **ER Diagram Tools**: 
  - Draw.io (diagrams.net)
  - dbdiagram.io
  - Lucidchart

### 4. Development Environment

#### 4.1 Code Editor
- **Visual Studio Code**: Primary IDE
  - Extensions: ESLint, Prettier, Tailwind CSS IntelliSense
  - Debugging configuration (.vscode/launch.json)
  - Workspace settings

#### 4.2 Version Control
- **Git**: Distributed version control system
- **GitHub**: Code hosting and collaboration platform

#### 4.3 Package Management
- **npm**: Node Package Manager
  - Dependency management
  - Script execution
  - Package versioning

### 5. Deployment and Hosting

#### 5.1 Frontend Hosting
- **Vercel**: Serverless deployment platform
  - Automatic deployments from Git
  - Global CDN
  - HTTPS by default
  - Environment variable management
  - Build optimization

#### 5.2 Backend Hosting
- **Render**: Cloud application hosting
  - Automatic deployments from Git
  - Health check monitoring
  - Environment variable management
  - Persistent storage
  - Auto-scaling

#### 5.3 Database Hosting
- **Supabase**: PostgreSQL hosting
  - Managed database service
  - Automatic backups
  - Connection pooling
  - Real-time capabilities

### 6. API Development Tools

#### 6.1 API Testing
- **Postman**: API development and testing platform
- **Thunder Client**: VS Code extension for API testing
- **cURL**: Command-line HTTP client

#### 6.2 API Documentation
- **Swagger/OpenAPI**: API specification (if implemented)
- **README.md**: API endpoint documentation

### 7. Real-time Communication

#### 7.1 Server-Sent Events (SSE)
- **Custom Implementation**: Real-time data updates
  - Event stream for live updates
  - Keep-alive connections
  - Automatic reconnection
  - JWT-based authentication

### 8. Security Tools

#### 8.1 Authentication Security
- **JWT Secret**: Environment-based secret key
- **Password Hashing**: bcrypt with salt rounds
- **Login Attempt Tracking**: Custom middleware
- **Account Locking**: Automatic after failed attempts

#### 8.2 Input Validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **CORS Configuration**: Whitelist-based origin control

### 9. Development Workflow

#### 9.1 Local Development
```bash
# Frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Backend
cd backend
npm install
npm start    # Runs on http://localhost:5000
```

#### 9.2 Environment Configuration
- **Frontend**: `.env` file with `VITE_API_URL`
- **Backend**: `.env` file with database credentials, JWT secret, CORS origin

#### 9.3 Build Process
```bash
# Frontend production build
npm run build  # Outputs to /dist

# Backend production
npm start  # Uses NODE_ENV=production
```

### 10. Code Organization

#### 10.1 Frontend Structure
```
src/
├── app/
│   ├── components/      # Reusable UI components
│   │   ├── dashboards/  # Role-specific dashboards
│   │   └── ui/          # Base UI components
│   ├── contexts/        # React Context providers
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── utils/           # Utility functions
│   └── routes.jsx       # Route configuration
├── styles/              # Global styles
└── main.jsx            # Application entry point
```

#### 10.2 Backend Structure
```
backend/
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
├── routes/             # API routes
├── scripts/            # Utility scripts
└── server.js          # Server entry point
```

### 11. Design Tools

#### 11.1 UI/UX Design
- **Figma**: Interface design and prototyping (if used)
- **Tailwind CSS**: Utility-first styling approach
- **Component Library**: Custom-built with Radix UI primitives

#### 11.2 Database Design
- **ER Diagrams**: Entity-relationship modeling
- **Schema Visualization**: Database structure documentation
- **Normalization**: 3NF compliance

### 12. Testing Tools (If Implemented)

#### 12.1 Unit Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing

#### 12.2 Integration Testing
- **Supertest**: HTTP assertion library
- **Database Testing**: Test database setup

### 13. Performance Optimization

#### 13.1 Frontend Optimization
- **Code Splitting**: Dynamic imports
- **Lazy Loading**: Route-based code splitting
- **Asset Optimization**: Vite build optimization
- **Caching**: Browser caching strategies

#### 13.2 Backend Optimization
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient SQL queries
- **Caching**: In-memory caching (if implemented)

### 14. Monitoring and Logging

#### 14.1 Application Monitoring
- **Console Logging**: Development debugging
- **Error Tracking**: Server-side error logging
- **Health Checks**: `/health` endpoint for monitoring

#### 14.2 Database Monitoring
- **Supabase Dashboard**: Query performance monitoring
- **Connection Monitoring**: Active connection tracking

## System Screenshots

### 1. Authentication

#### 1.1 Login Page
**Description**: Secure login interface with username and password authentication. Includes error handling for invalid credentials and locked accounts.

**Features**:
- Username and password input fields
- "Remember me" option
- Login button with loading state
- Error message display
- Account lockout notification after 5 failed attempts
- Responsive design for mobile and desktop

**Security Features**:
- Password masking
- JWT token generation
- Session management
- Login attempt tracking

---

#### 1.2 Account Locked Screen
**Description**: Notification displayed when a user account is locked after multiple failed login attempts.

**Features**:
- Clear error message
- Contact administrator instructions
- Return to login option

---

### 2. Admin Dashboard

#### 2.1 Admin Overview
**Description**: Comprehensive dashboard for system administrators with key metrics and quick actions.

**Features**:
- Total students count
- Total teachers count
- Total classes count
- Total subjects count
- Active academic year display
- Quick navigation to management pages
- Recent activity feed
- System statistics charts

**Navigation Menu**:
- Dashboard
- Students Management
- Teachers Management
- Classes Management
- Subjects Management
- Marks Management
- Reports
- Credentials Generator
- Profile Settings

---

#### 2.2 Students Management
**Description**: Complete student record management interface.

**Features**:
- Student list with search and filter
- Add new student button
- Student details: name, admission number, class, roll number, gender, status
- Edit student information
- Delete student (with confirmation)
- Generate login credentials
- View student academic records
- Pagination for large datasets
- Export to CSV/PDF

**Student Form Fields**:
- First Name, Last Name
- Email, Phone
- Admission Number, Roll Number
- Date of Birth, Gender, Blood Group
- Class Assignment
- Parent/Guardian Information
- Address and Emergency Contact
- Profile Photo Upload

---

#### 2.3 Teachers Management
**Description**: Teacher record management and assignment interface.

**Features**:
- Teacher list with search and filter
- Add new teacher button
- Teacher details: name, email, department, qualification, status
- Edit teacher information
- Delete teacher (with confirmation)
- Generate login credentials
- Assign subjects and classes
- View teaching assignments
- Pagination for large datasets

**Teacher Form Fields**:
- First Name, Last Name
- Email, Phone
- Department Assignment
- Date of Birth, Hire Date
- Qualification
- Address and Emergency Contact
- Profile Photo Upload

---

#### 2.4 Classes Management
**Description**: Class configuration and student enrollment management.

**Features**:
- Class list with details
- Add new class button
- Class details: name, grade, section, academic year, homeroom teacher
- Edit class information
- Delete class (with confirmation)
- View enrolled students
- Assign homeroom teacher
- Set maximum capacity
- View class statistics

**Class Form Fields**:
- Class Name
- Grade Level
- Section
- Academic Year
- Homeroom Teacher
- Maximum Students

---

#### 2.5 Subjects Management
**Description**: Subject/course configuration interface.

**Features**:
- Subject list with details
- Add new subject button
- Subject details: name, code, department, max marks, passing marks, credit hours
- Edit subject information
- Delete subject (with confirmation)
- View assigned teachers
- Active/inactive status toggle

**Subject Form Fields**:
- Subject Name
- Subject Code
- Description
- Department
- Maximum Marks (default: 100)
- Passing Marks (default: 40)
- Credit Hours

---

#### 2.6 Credentials Generator
**Description**: Bulk credential generation for students and teachers.

**Features**:
- Select user type (Student/Teacher)
- Generate username and password
- Display generated credentials
- Copy to clipboard
- Print credentials
- Email credentials (if configured)

---

### 3. Teacher Dashboard

#### 3.1 Teacher Overview
**Description**: Personalized dashboard for teachers showing their assignments and quick stats.

**Features**:
- My Classes count
- My Students count
- Subjects Teaching count
- Pending marks entry count
- Quick navigation to assigned classes
- Recent marks entries
- Upcoming exams/deadlines

**Navigation Menu**:
- Dashboard
- My Classes
- Students
- Marks Entry
- Reports
- Profile Settings

---

#### 3.2 My Classes Tab
**Description**: View all assigned classes and subjects.

**Features**:
- List of assigned classes
- Subject assignments per class
- Student count per class
- Quick access to marks entry
- View class roster
- Generate class reports

---

#### 3.3 Students Tab
**Description**: View students in assigned classes.

**Features**:
- Student list filtered by assigned classes
- Student details: name, admission number, class, roll number
- Search and filter students
- View student academic records
- View student marks history

---

#### 3.4 Marks Entry Tab
**Description**: Enter and manage student marks for assigned subjects.

**Features**:
- Select class and subject
- Select exam type (Midterm, Final, Quiz, Assignment)
- Student list with marks entry fields
- Marks obtained input (max 100)
- Grade auto-calculation
- Remarks field
- Exam date picker
- Bulk save functionality
- Edit existing marks
- Validation: marks ≤ max marks

**Marks Entry Form**:
- Class Selection
- Subject Selection
- Exam Type Selection
- Student Name (read-only)
- Marks Obtained (0-100)
- Grade (auto-calculated)
- Remarks (optional)
- Exam Date

**Grade Calculation Display**:
- A (90-100%): Excellent - Green
- B (80-89.99%): Very Good - Blue
- C (60-79.99%): Good - Yellow
- D (50-59.99%): Satisfactory - Orange
- F (0-49.99%): Failure - Red

---

#### 3.5 Reports Tab
**Description**: Generate and view reports for assigned classes.

**Features**:
- Select class for report
- View class performance summary
- Student-wise performance
- Subject-wise analysis
- Pass/fail statistics
- Export to PDF
- Print report

---

### 4. Student Dashboard

#### 4.1 Student Overview
**Description**: Personalized dashboard for students showing their academic information.

**Features**:
- Student profile information
- Current class and section
- Academic year and semester
- Total subjects enrolled
- Overall average percentage
- Current rank in class
- PASS/FAIL status
- Recent marks entries

**Navigation Menu**:
- Dashboard
- My Marks
- My Report
- Course Registration
- Profile Settings

---

#### 4.2 My Marks Tab
**Description**: View all marks across subjects and exam types.

**Features**:
- Subject-wise marks display
- Exam type breakdown (Midterm, Final, Quiz, Assignment)
- Marks obtained / Max marks
- Percentage calculation
- Grade display with color coding
- Teacher remarks
- Exam date
- Filter by subject
- Filter by exam type
- Filter by academic year

**Marks Display Table**:
| Subject | Exam Type | Marks | Max | Percentage | Grade | Remarks | Date |
|---------|-----------|-------|-----|------------|-------|---------|------|

---

#### 4.3 My Report Tab
**Description**: Comprehensive academic report with performance analysis.

**Features**:
- Student information header
- Subject-wise performance table
- Weighted total calculation
- Overall average percentage
- Class rank
- PASS/FAIL status
- Grade distribution chart
- Performance trend graph
- Export to PDF
- Print report

**Report Card Layout**:
```
┌─────────────────────────────────────────────────┐
│         STUDENT ACADEMIC REPORT CARD            │
│                                                 │
│  Name: Sara Ali                                 │
│  Admission No: ADM-2025-001                     │
│  Class: Grade 10 A                              │
│  Academic Year: 2025-2026, Semester 1           │
├─────────────────────────────────────────────────┤
│  Subject Performance:                           │
│                                                 │
│  Subject      | Mid | Final | Quiz | Assgn | Total | Grade │
│  ─────────────┼─────┼───────┼──────┼───────┼───────┼───────│
│  Mathematics  │  72 │   85  │   9  │   8   │ 80.60 │   B   │
│  Physics      │  65 │   78  │   7  │   9   │ 73.50 │   C   │
│  Chemistry    │  70 │   75  │   8  │   7   │ 72.50 │   C   │
│  Biology      │  82 │   90  │  10  │   9   │ 87.20 │   B   │
│  English      │  80 │   88  │   9  │  10   │ 86.70 │   B   │
│                                                 │
│  Overall Average: 80.10%                        │
│  Class Rank: 1 / 35                             │
│  Status: PASS                                   │
│  Overall Grade: B (Very Good)                   │
└─────────────────────────────────────────────────┘
```

---

#### 4.4 Course Registration Tab
**Description**: Register for subjects/courses for upcoming semester.

**Features**:
- Available subjects list
- Subject details: name, code, credit hours, department
- Select subjects to register
- View registration status (Pending/Approved/Rejected)
- Submit registration
- View registered courses

---

### 5. Profile Management

#### 5.1 Profile View
**Description**: View and edit user profile information.

**Features**:
- Profile photo display
- Personal information
- Contact information
- Role-specific information
- Edit profile button
- Change password button

**Profile Information Display**:
- Full Name
- Email Address
- Phone Number
- Role (Admin/Teacher/Student)
- For Students: Admission Number, Class, Roll Number
- For Teachers: Department, Qualification, Hire Date

---

#### 5.2 Edit Profile
**Description**: Update profile information.

**Features**:
- Edit personal information
- Update contact details
- Upload/change profile photo
- Save changes button
- Cancel button
- Form validation

---

#### 5.3 Change Password
**Description**: Secure password change interface.

**Features**:
- Current password input
- New password input
- Confirm new password input
- Password strength indicator
- Show/hide password toggle
- Save button
- Cancel button
- Validation: passwords must match

---

### 6. Reports and Analytics

#### 6.1 Class Report
**Description**: Comprehensive class performance report.

**Features**:
- Class information header
- Student list with performance metrics
- Rank column
- Total marks, average, status
- Class statistics summary
- Pass/fail count
- Class average
- Highest and lowest scores
- Grade distribution chart
- Export to PDF
- Print report

---

#### 6.2 Student Report
**Description**: Individual student academic report.

**Features**:
- Student information
- Subject-wise marks breakdown
- Exam type details
- Weighted total calculation
- Overall performance metrics
- Grade and status
- Teacher remarks
- Export to PDF
- Print report

---

### 7. System Features

#### 7.1 Responsive Design
**Description**: The system is fully responsive and works on all devices.

**Supported Devices**:
- Desktop (1920x1080 and above)
- Laptop (1366x768 and above)
- Tablet (768x1024)
- Mobile (375x667 and above)

---

#### 7.2 Real-time Updates
**Description**: Live data synchronization across all connected clients.

**Features**:
- Automatic data refresh
- Server-Sent Events (SSE)
- No page reload required
- Instant updates on marks entry
- Live student/teacher additions

---

#### 7.3 Security Features
**Description**: Comprehensive security implementation.

**Features**:
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session timeout (30 minutes)
- Account lockout after 5 failed attempts
- HTTPS encryption
- CORS protection
- SQL injection prevention
- XSS protection

---

### 8. Ethiopian Grading System Implementation

#### 8.1 Grade Display
**Description**: Color-coded grade display following Ethiopian curriculum standards.

**Grade Colors**:
- A (90-100%): Green - Excellent
- B (80-89.99%): Blue - Very Good
- C (60-79.99%): Yellow - Good
- D (50-59.99%): Orange - Satisfactory
- F (0-49.99%): Red - Failure

**Passing Mark**: 50% (Grade D or above)

---

#### 8.2 Weighted Calculation
**Description**: Automatic weighted total calculation based on exam types.

**Exam Weightage**:
- Midterm: 30%
- Final: 50%
- Quiz: 10%
- Assignment: 10%
- Total: 100%

**Calculation Formula**:
```
Weighted Total = (Midterm/100 × 30) + (Final/100 × 50) + (Quiz/100 × 10) + (Assignment/100 × 10)
```

---

### 9. Data Export Features

#### 9.1 PDF Export
**Description**: Export reports to PDF format.

**Features**:
- Student report PDF
- Class report PDF
- Formatted layout
- School branding
- Print-ready format

#### 9.2 Print Functionality
**Description**: Direct printing of reports.

**Features**:
- Browser print dialog
- Optimized print layout
- Page breaks
- Header/footer

---

### 10. Error Handling

#### 10.1 Error Messages
**Description**: User-friendly error messages for various scenarios.

**Error Types**:
- Authentication errors
- Validation errors
- Network errors
- Permission errors
- Database errors

#### 10.2 Loading States
**Description**: Visual feedback during data loading.

**Features**:
- Skeleton loaders
- Spinner animations
- Progress indicators
- Disabled buttons during submission

---

**Note**: Actual screenshots should be captured from the running application and inserted into this document. The descriptions above provide context for what each screenshot should demonstrate.
