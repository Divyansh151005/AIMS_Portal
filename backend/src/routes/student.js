import express from 'express';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  getStudentDashboard,
  getEnrolledCourses,
  getPendingApprovals,
  getTimetable,
  getGrades,
} from '../controllers/studentController.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate);
router.use(requireRole('STUDENT'));
router.use(requireActive);

router.get('/dashboard', getStudentDashboard);
router.get('/courses', getEnrolledCourses);
router.get('/approvals', getPendingApprovals);
router.get('/timetable', getTimetable);
router.get('/grades', getGrades);

export default router;
