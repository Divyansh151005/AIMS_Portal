import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  enrollInCourse,
  dropCourse,
  getMyEnrollments,
  approveInstructorEnrollment,
  approveAdvisorEnrollment,
  rejectEnrollment,
} from '../controllers/enrollmentController.js';

const router = express.Router();

router.use(authenticate);

// Student routes
const enrollmentValidation = [
  body('courseOfferingId').notEmpty().withMessage('Course offering ID is required'),
];

router.post('/enroll', requireRole('STUDENT'), requireActive, enrollmentValidation, enrollInCourse);
router.post('/drop/:id', requireRole('STUDENT'), requireActive, dropCourse);
router.get('/my', requireRole('STUDENT'), requireActive, getMyEnrollments);

// Instructor routes
router.post('/approve/instructor/:id', requireRole('TEACHER'), requireActive, approveInstructorEnrollment);
router.post('/reject/:id', requireRole('TEACHER', 'ADMIN'), requireActive, rejectEnrollment);

// Advisor routes (also teacher role)
router.post('/approve/advisor/:id', requireRole('TEACHER'), requireActive, approveAdvisorEnrollment);

export default router;
