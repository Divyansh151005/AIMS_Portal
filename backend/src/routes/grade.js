import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole, requireActive } from '../middleware/auth.js';
import {
  assignGrade,
  updateGrade,
  publishGrade,
  getGradesByCourse,
  getStudentGrades,
} from '../controllers/gradeController.js';

const router = express.Router();

router.use(authenticate);

// Teacher routes
const gradeValidation = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('courseOfferingId').notEmpty().withMessage('Course offering ID is required'),
  body('grade').optional({ nullable: true, checkFalsy: true }).isString(),
  body('marks').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Marks must be a number between 0 and 100'),
];

router.post('/', requireRole('TEACHER'), requireActive, gradeValidation, assignGrade);
// Update grade validation - only grade and marks are required, not studentId/courseOfferingId
const updateGradeValidation = [
  body('grade').optional({ nullable: true, checkFalsy: true }).isString(),
  body('marks').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 100 }).withMessage('Marks must be a number between 0 and 100'),
];
router.put('/:id', requireRole('TEACHER'), requireActive, updateGradeValidation, updateGrade);
router.post('/:id/publish', requireRole('TEACHER'), requireActive, publishGrade);
router.get('/course/:courseOfferingId', requireRole('TEACHER'), requireActive, getGradesByCourse);

// Student routes
router.get('/student', requireRole('STUDENT'), requireActive, getStudentGrades);

export default router;
