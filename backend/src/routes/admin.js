import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  getDashboard,
  getPendingStudentApprovals,
  approveStudent,
  rejectStudent,
  assignAdvisor,
  getTeachers,
  createTeacher,
  removeTeacher,
  getPendingCourseApprovals,
  approveCourse,
  rejectCourse,
  getAllStudents,
  getAllTeachers,
  getSystemStats,
  getPendingTeacherApprovals,
  approveTeacher,
  rejectTeacher,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));
router.use(requireActive);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/stats', getSystemStats);

// Student management
router.get('/students/pending', getPendingStudentApprovals);
router.post('/students/:id/approve', approveStudent);
router.post('/students/:id/reject', rejectStudent);
router.post('/students/:id/advisor', body('advisorId').notEmpty(), assignAdvisor);
router.get('/students', getAllStudents);

// Teacher management
router.get('/teachers', getAllTeachers);
router.get('/teachers/pending', getPendingTeacherApprovals);
router.post('/teachers', [
  body('email').isEmail(),
  body('name').notEmpty(),
  body('password').isLength({ min: 6 }),
  body('department').notEmpty(),
], createTeacher);
router.post('/teachers/:id/approve', approveTeacher);
router.post('/teachers/:id/reject', rejectTeacher);
router.delete('/teachers/:id', removeTeacher);

// Course approval
router.get('/courses/pending', getPendingCourseApprovals);
router.post('/courses/:id/approve', approveCourse);
router.post('/courses/:id/reject', rejectCourse);

export default router;
