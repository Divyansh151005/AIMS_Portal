import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateToken } from '../utils/auth.js';
import { parseStudentEmail } from '../utils/emailParser.js';
import { sendSignupOTP, sendLoginOTP, verifyOTPCode } from '../config/clerk.js';

// Use string literals for enum values (Prisma enums are strings)
const UserRole = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
};

const UserStatus = {
  ACTIVE: 'ACTIVE',
  PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE',
};

// Temporary storage for signup data pending OTP verification
// In production, consider using Redis or database with TTL
const signupPendingStore = new Map();

/**
 * Step 1: Initiate signup - collect user data and send OTP
 */
export const initiateSignup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, branch, entryYear, department } = req.body;

    // Validate role
    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Only STUDENT and TEACHER can sign up.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // For students, validate email format and parse data
    let parsedData = null;
    if (role === 'STUDENT') {
      try {
        parsedData = parseStudentEmail(email);
      } catch (error) {
        return res.status(400).json({ error: `Invalid student email format: ${error.message}` });
      }
    }

    // Send OTP via Clerk
    const otpResult = await sendSignupOTP(email.toLowerCase());

    // Store signup data temporarily (expires in 10 minutes)
    const signupData = {
      name,
      email: email.toLowerCase(),
      role,
      branch: role === 'STUDENT' ? branch : undefined,
      entryYear: role === 'STUDENT' ? entryYear : undefined,
      department: role === 'TEACHER' ? department : undefined,
      parsedData,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    };
    signupPendingStore.set(email.toLowerCase(), signupData);

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete signup.',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Initiate signup error:', error);
    next(error);
  }
};

/**
 * Step 2: Verify signup OTP and create user account
 */
export const verifySignupOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Get pending signup data
    const signupData = signupPendingStore.get(email.toLowerCase());

    if (!signupData) {
      return res.status(400).json({ error: 'No pending signup found. Please start signup again.' });
    }

    // Check expiration
    if (Date.now() > signupData.expiresAt) {
      signupPendingStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP has expired. Please start signup again.' });
    }

    // Check attempts (max 3)
    if (signupData.attempts >= 3) {
      signupPendingStore.delete(email.toLowerCase());
      return res.status(429).json({ error: 'Too many failed attempts. Please start signup again.' });
    }

    // Verify OTP via Clerk
    try {
      await verifyOTPCode(email.toLowerCase(), otp);
    } catch (verifyError) {
      signupData.attempts += 1;
      signupPendingStore.set(email.toLowerCase(), signupData);
      return res.status(400).json({
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: 3 - signupData.attempts,
      });
    }

    // OTP is valid, create user account
    signupPendingStore.delete(email.toLowerCase());

    if (signupData.role === 'STUDENT') {
      // Create user and student in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: signupData.email,
            name: signupData.name,
            role: UserRole.STUDENT,
            status: UserStatus.PENDING_ADMIN_APPROVAL,
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            rollNumber: signupData.parsedData.rollNumber,
            branch: signupData.parsedData.branch,
            entryYear: signupData.parsedData.entryYear,
          },
        });

        return { user, student };
      });

      // Generate token for immediate login
      const token = generateToken(result.user.id, result.user.role);

      return res.status(201).json({
        message: 'Student account created successfully. Awaiting admin approval.',
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          status: result.user.status,
          student: result.student,
        },
      });
    } else if (signupData.role === 'TEACHER') {
      // Create teacher account
      const user = await prisma.user.create({
        data: {
          email: signupData.email,
          name: signupData.name,
          role: UserRole.TEACHER,
          status: UserStatus.PENDING_ADMIN_APPROVAL,
        },
      });

      // Generate token for immediate login
      const token = generateToken(user.id, user.role);

      return res.status(201).json({
        message: 'Teacher account created successfully. Awaiting admin approval.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      });
    }
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    next(error);
  }
};

/**
 * Get current user info
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        student: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        teacher: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

// OTP Storage for login (in production, use Redis or database)
const loginOtpStore = new Map();

/**
 * Send OTP for login
 */
export const sendLoginOTPHandler = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        error: `Account is ${user.status}. Please wait for approval.`,
        status: user.status,
      });
    }

    // Send OTP via Clerk
    const otpResult = await sendLoginOTP(email.toLowerCase());

    // Store OTP data with expiration (10 minutes)
    const otpData = {
      email: email.toLowerCase(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
    };
    loginOtpStore.set(email.toLowerCase(), otpData);

    res.json({
      message: 'OTP sent successfully to your email',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    next(error);
  }
};

/**
 * Verify OTP and login user
 */
export const verifyLoginOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Get stored OTP
    const otpData = loginOtpStore.get(email.toLowerCase());

    if (!otpData) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      loginOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts (max 3)
    if (otpData.attempts >= 3) {
      loginOtpStore.delete(email.toLowerCase());
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP via Clerk
    try {
      await verifyOTPCode(email.toLowerCase(), otp);
    } catch (verifyError) {
      otpData.attempts += 1;
      loginOtpStore.set(email.toLowerCase(), otpData);
      return res.status(400).json({
        error: 'Invalid OTP. Please try again.',
        attemptsRemaining: 3 - otpData.attempts,
      });
    }

    // OTP is valid, delete it
    loginOtpStore.delete(email.toLowerCase());

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check status
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        error: `Account is ${user.status}. Please wait for approval.`,
        status: user.status,
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    next(error);
  }
};
