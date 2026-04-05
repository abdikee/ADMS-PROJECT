# Requirements Document

## Introduction

This document defines the requirements for migrating the Student Academic Record Management System (SAMS) frontend from React + TypeScript + Tailwind CSS + Radix UI to React + JavaScript + Tailwind CSS, with no TypeScript and no Radix UI. The backend (Node.js/Express) and database (MySQL) remain unchanged. All existing features, UI/UX appearance, and user-facing behavior must be preserved exactly.

## Glossary

- **SAMS**: Student Academic Record Management System — the application being migrated
- **Auth_Module**: The frontend module responsible for login, logout, JWT persistence, and session state (`auth.js`)
- **API_Service**: The centralised HTTP client module that handles all communication with the Express backend (`services/api.js`)
- **Router**: The client-side routing module that maps URL paths to page components and enforces the auth guard
- **Data_Normalizer**: The set of pure functions that convert raw API response objects into normalised frontend data models
- **Report_Calculator**: The pure function `calculateStudentReport` that computes totals, averages, pass/fail status, and class rank
- **Layout_Component**: The persistent shell component containing the sidebar navigation and top header
- **Auth_Guard**: The logic within the Router that checks authentication and role before rendering a protected route
- **JWT**: JSON Web Token — the bearer token issued by the backend on successful login
- **localStorage**: Browser-native key-value storage used to persist the JWT and user session

---

## Requirements

### Requirement 1: Tech Stack Configuration

**User Story:** As a developer, I want the frontend to use React + JavaScript + Tailwind CSS with no TypeScript or Radix UI, so that the codebase is simpler and free of type-system overhead.

#### Acceptance Criteria

1. THE Application SHALL be implemented in JavaScript (`.js` / `.jsx` files) with no TypeScript source files
2. THE Application SHALL use React and React DOM as the UI framework
3. THE Application SHALL use Tailwind CSS as the sole CSS framework, with no Radix UI dependency
4. THE Application SHALL use Vite as the build tool with `@vitejs/plugin-react`
5. THE Application SHALL use `react-router-dom` for client-side routing

---

### Requirement 2: Authentication and Session Management

**User Story:** As a user, I want to log in with my credentials and have my session persisted, so that I can navigate the application without re-authenticating on every page load.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Module SHALL store the JWT token under the key `token` in localStorage
2. WHEN a user submits valid credentials, THE Auth_Module SHALL store the serialised user object under the key `sams_user` in localStorage
3. WHILE a valid session exists in localStorage, THE Auth_Module SHALL return `true` from `isLoggedIn()`
4. WHEN a user logs out, THE Auth_Module SHALL remove both `token` and `sams_user` from localStorage
5. WHEN a user logs out, THE Auth_Module SHALL return `false` from `isLoggedIn()`
6. IF the backend returns HTTP 401, THEN THE Auth_Module SHALL clear the session and redirect the user to `/login`
7. WHEN a login attempt fails, THE Application SHALL display the error message returned by the backend

---

### Requirement 3: API Service

**User Story:** As a developer, I want all backend communication centralised in a single API service module, so that authentication headers and error handling are applied consistently.

#### Acceptance Criteria

1. THE API_Service SHALL send all requests to the base URL configured via the `VITE_API_URL` environment variable
2. WHILE a JWT token is present in localStorage, THE API_Service SHALL attach an `Authorization: Bearer <token>` header to every request
3. WHEN a request returns a non-2xx HTTP status, THE API_Service SHALL throw an error object containing `message` and `status` fields
4. WHEN a network failure prevents the request from completing, THE API_Service SHALL throw an error object with `status` equal to `0` and a descriptive `message`
5. THE API_Service SHALL expose methods for all existing backend endpoints: login, students CRUD, teachers CRUD, classes CRUD, subjects CRUD, marks, reports, reference data, and profile management

---

### Requirement 4: Client-Side Routing and Auth Guard

**User Story:** As a system administrator, I want routes to be protected by role, so that users can only access pages appropriate to their role.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any protected route, THE Router SHALL redirect the user to `/login`
2. WHEN an authenticated user navigates to a route not permitted for their role, THE Router SHALL redirect the user to `/`
3. WHEN an authenticated user navigates to a permitted route, THE Router SHALL render the corresponding page component
4. THE Router SHALL define the following role-to-route mapping:
   - `/login` — public
   - `/` — Admin, Teacher, Student
   - `/students` — Admin, Teacher
   - `/teachers` — Admin
   - `/classes` — Admin
   - `/subjects` — Admin
   - `/marks` — Teacher
   - `/reports` — Admin, Teacher, Student
   - `/credentials` — Admin
   - `/profile` — Admin, Teacher, Student
5. WHEN no route matches the current path, THE Router SHALL render the NotFoundPage component

---

### Requirement 5: Data Normalisation

**User Story:** As a developer, I want raw API responses normalised into consistent camelCase frontend models, so that all components work with a predictable data shape.

#### Acceptance Criteria

1. WHEN a raw student object is received from the API, THE Data_Normalizer SHALL map `first_name` or `firstName` to `firstName` and `last_name` or `lastName` to `lastName`
2. WHEN normalising a student, THE Data_Normalizer SHALL set the `name` field to `firstName + ' ' + lastName`
3. WHEN normalising a student, THE Data_Normalizer SHALL set `hasCredentials` to `false` if `username` is `null` or starts with `'temp_'`, and `true` otherwise
4. WHEN normalising a student, THE Data_Normalizer SHALL convert the `id` field to a string
5. THE Data_Normalizer SHALL be idempotent: normalising an already-normalised student object SHALL produce an equivalent result
6. WHEN a raw teacher object is received from the API, THE Data_Normalizer SHALL parse `assignedClassIds` into an array of strings

---

### Requirement 6: Report Calculation

**User Story:** As a teacher or administrator, I want student reports to show accurate totals, averages, pass/fail status, and class rank, so that academic performance is correctly communicated.

#### Acceptance Criteria

1. THE Report_Calculator SHALL compute `total` as the sum of all mark values for the student
2. THE Report_Calculator SHALL compute `average` as `(total / maxTotal) * 100`, where `maxTotal` is the sum of all `maxMarks` values
3. THE Report_Calculator SHALL always return an `average` value in the range `[0, 100]`
4. WHEN a student's `average` is greater than or equal to `50`, THE Report_Calculator SHALL set `status` to `'PASS'`
5. WHEN a student's `average` is less than `50`, THE Report_Calculator SHALL set `status` to `'FAIL'`
6. THE Report_Calculator SHALL assign `rank` `1` to the student with the highest total marks in their class
7. WHEN `maxTotal` is `0`, THE Report_Calculator SHALL return an `average` of `0`

---

### Requirement 7: Layout and Navigation

**User Story:** As a user, I want a persistent sidebar and header that reflect my role, so that I can navigate to the pages I am authorised to use.

#### Acceptance Criteria

1. THE Layout_Component SHALL render navigation links only for routes permitted by the current user's role
2. THE Layout_Component SHALL display the current user's name in the header
3. WHEN a user clicks the logout action, THE Layout_Component SHALL invoke `auth.clearSession()` and redirect to `/login`
4. THE Layout_Component SHALL support a mobile sidebar toggle for viewports below the responsive breakpoint

---

### Requirement 8: Feature Completeness and UI Preservation

**User Story:** As a user, I want the migrated application to look and behave identically to the original, so that my workflow is not disrupted.

#### Acceptance Criteria

1. THE Application SHALL implement all existing pages: LoginPage, DashboardPage (Admin/Teacher/Student variants), StudentsPage, TeachersPage, ClassesPage, SubjectsPage, MarksPage, ReportsPage, CredentialsPage, ProfilePage, and NotFoundPage
2. THE Application SHALL preserve the existing visual design, layout, colour scheme, and component structure using Tailwind CSS utility classes
3. THE Application SHALL support all existing CRUD operations for students, teachers, classes, and subjects
4. THE Application SHALL support marks entry and editing by teachers
5. THE Application SHALL support report generation for students, teachers, and administrators
6. THE Application SHALL support credential generation and display for administrators
7. THE Application SHALL support profile viewing and editing for all roles
