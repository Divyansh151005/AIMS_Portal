import express from 'express';
import { body } from 'express-validator';
import {
  initiateSignup,
  verifySignupOTP,
  getMe,
  sendLoginOTPHandler,
  verifyLoginOTP
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const signupInitiateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['STUDENT', 'TEACHER']).withMessage('Valid role is required'),
];

const otpVerifyValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];

const otpSendValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

// Signup routes (two-step process)
router.post('/signup', signupInitiateValidation, initiateSignup);
router.post('/signup/verify', otpVerifyValidation, verifySignupOTP);

// Login routes (OTP only)
router.post('/login/otp/send', otpSendValidation, sendLoginOTPHandler);
router.post('/login/otp/verify', otpVerifyValidation, verifyLoginOTP);

// Legacy OTP routes (for backward compatibility)
router.post('/otp/send', otpSendValidation, sendLoginOTPHandler);
router.post('/otp/verify', otpVerifyValidation, verifyLoginOTP);

// Get current user
router.get('/me', authenticate, getMe);

export default router;
