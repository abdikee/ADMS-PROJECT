import express from 'express';
import { login, register } from '../controllers/authController.js';
import { 
  getAllStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  generateCredentials as generateStudentCredentials
} from '../controllers/studentController.js';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  generateCredentials as generateTeacherCredentials
} from '../controllers/teacherController.js';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import {
  getMarks,
  createMarks,
  updateMark
} from '../controllers/marksController.js';
import {
  getStudentReport,
  getClassReport
} from '../controllers/reportController.js';
import {
  getMyCourseRegistrations,
  saveMyCourseRegistrations
} from '../controllers/courseRegistrationController.js';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword
} from '../controllers/profileController.js';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import {
  getDepartments,
  getExamTypes,
  getAcademicYears
} from '../controllers/referenceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.post('/auth/login', login);
router.post('/auth/register', register);

// Profile routes
router.get('/profile/me', authenticate, getMyProfile);
router.put('/profile/me', authenticate, updateMyProfile);
router.post('/profile/me/change-password', authenticate, changeMyPassword);

// Student routes
router.get('/students', authenticate, getAllStudents);
router.get('/students/:id', authenticate, getStudentById);
router.post('/students', authenticate, authorize('admin'), createStudent);
router.put('/students/:id', authenticate, authorize('admin'), updateStudent);
router.delete('/students/:id', authenticate, authorize('admin'), deleteStudent);
router.post('/students/:id/generate-credentials', authenticate, authorize('admin'), generateStudentCredentials);

// Teacher routes
router.get('/teachers', authenticate, getAllTeachers);
router.get('/teachers/:id', authenticate, getTeacherById);
router.post('/teachers', authenticate, authorize('admin'), createTeacher);
router.put('/teachers/:id', authenticate, authorize('admin'), updateTeacher);
router.delete('/teachers/:id', authenticate, authorize('admin'), deleteTeacher);
router.post('/teachers/:id/generate-credentials', authenticate, authorize('admin'), generateTeacherCredentials);

// Subject routes
router.get('/subjects', authenticate, getAllSubjects);
router.get('/subjects/:id', authenticate, getSubjectById);
router.post('/subjects', authenticate, authorize('admin'), createSubject);
router.put('/subjects/:id', authenticate, authorize('admin'), updateSubject);
router.delete('/subjects/:id', authenticate, authorize('admin'), deleteSubject);

// Marks routes
router.get('/marks', authenticate, getMarks);
router.post('/marks', authenticate, authorize('teacher'), createMarks);
router.put('/marks/:id', authenticate, authorize('teacher'), updateMark);

// Report routes
router.get('/reports/student/:id', authenticate, getStudentReport);
router.get('/reports/class', authenticate, getClassReport);

// Student course registration routes
router.get('/course-registrations/me', authenticate, authorize('student'), getMyCourseRegistrations);
router.post('/course-registrations/me', authenticate, authorize('student'), saveMyCourseRegistrations);

// Class routes
router.get('/classes', authenticate, getAllClasses);
router.get('/classes/:id', authenticate, getClassById);
router.post('/classes', authenticate, authorize('admin'), createClass);
router.put('/classes/:id', authenticate, authorize('admin'), updateClass);
router.delete('/classes/:id', authenticate, authorize('admin'), deleteClass);

// Reference data routes
router.get('/departments', authenticate, getDepartments);
router.get('/exam-types', authenticate, getExamTypes);
router.get('/academic-years', authenticate, getAcademicYears);

export default router;
