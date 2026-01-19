import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  createCourseOffering,
  getMyCourseOfferings,
  getApprovedCourses,
  getCourseDetails,
  updateCourseOffering,
} from '../controllers/courseController.js';

const router = express.Router();

// Public route - get approved courses (for course registration)
router.get('/approved', getApprovedCourses);
router.get('/:id', getCourseDetails);

// Protected routes
router.use(authenticate);

// Teacher routes
const courseOfferingValidation = [
  body('courseCode').trim().notEmpty().withMessage('Course code is required'),
  body('courseTitle').trim().notEmpty().withMessage('Course title is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('semester').isIn(['SPRING_2025', 'FALL_2025']).withMessage('Valid semester is required'),
  body('courseType').isIn(['CORE', 'PROGRAM_ELECTIVE', 'OPEN_ELECTIVE', 'SCIENCE_MATH_ELECTIVE', 'HS_ELECTIVE']).withMessage('Valid course type is required'),
  body('slot').isIn(['PC1', 'PC2', 'PC3', 'PC4', 'PCE1', 'PCE2', 'PCE3', 'HSME', 'HSPE', 'PEOE', 'PCPE', 'PCDE', 'PHSME']).withMessage('Valid slot is required'),
  body('L').isInt({ min: 0 }).withMessage('L must be a non-negative integer'),
  body('P').isInt({ min: 0 }).withMessage('P must be a non-negative integer'),
];

router.post('/offerings', requireRole('TEACHER'), requireActive, courseOfferingValidation, createCourseOffering);
router.get('/offerings/my', requireRole('TEACHER'), requireActive, getMyCourseOfferings);
router.put('/offerings/:id', requireRole('TEACHER'), requireActive, courseOfferingValidation, updateCourseOffering);

export default router;
