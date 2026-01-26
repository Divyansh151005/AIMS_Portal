import express from 'express';
import { body, validationResult } from 'express-validator';
import { signup, sendOTP, verifyOTPAndLogin, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['STUDENT', 'TEACHER']).withMessage('Valid role is required'),
];

const sendOTPValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const verifyOTPValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

router.post('/signup', signupValidation, signup);
router.post('/send-otp', sendOTPValidation, sendOTP);
router.post('/verify-otp', verifyOTPValidation, verifyOTPAndLogin);
router.get('/me', authenticate, getMe);

export default router;
