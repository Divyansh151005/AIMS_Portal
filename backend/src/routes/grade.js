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
  body('grade').optional().isString(),
  body('marks').optional().isFloat({ min: 0, max: 100 }),
];

router.post('/', requireRole('TEACHER'), requireActive, gradeValidation, assignGrade);
router.put('/:id', requireRole('TEACHER'), requireActive, gradeValidation, updateGrade);
router.post('/:id/publish', requireRole('TEACHER'), requireActive, publishGrade);
router.get('/course/:courseOfferingId', requireRole('TEACHER'), requireActive, getGradesByCourse);

// Student routes
router.get('/student', requireRole('STUDENT'), requireActive, getStudentGrades);

export default router;
