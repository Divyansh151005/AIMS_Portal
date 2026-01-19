import express from 'express';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  getTeacherDashboard,
  getEnrollmentRequests,
  getMyCourses,
  getTimetable,
} from '../controllers/teacherController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('TEACHER'));
router.use(requireActive);

router.get('/dashboard', getTeacherDashboard);
router.get('/enrollments', getEnrollmentRequests);
router.get('/courses', getMyCourses);
router.get('/timetable', getTimetable);

export default router;
