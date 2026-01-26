import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateToken } from '../utils/auth.js';
import { parseStudentEmail } from '../utils/emailParser.js';
import { generateOTP, hashOTP, verifyOTP, isOTPExpired, getOTPExpiry } from '../utils/otpUtils.js';
import { sendOTPEmail } from '../config/email.js';

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

export const signup = async (req, res, next) => {
  console.log("hii")
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role } = req.body;

    // Validate role
    if (!['STUDENT', 'TEACHER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Only STUDENT and TEACHER can sign up.' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user transaction
    if (role === 'STUDENT') {
      // Parse student email
      let parsedData;
      try {
        parsedData = parseStudentEmail(email);
      } catch (error) {
        return res.status(400).json({ error: `Invalid student email format: ${error.message}` });
      }

      // Create user and student in transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            role: UserRole.STUDENT,
            status: UserStatus.PENDING_ADMIN_APPROVAL,
          },
        });

        const student = await tx.student.create({
          data: {
            userId: user.id,
            rollNumber: parsedData.rollNumber,
            branch: parsedData.branch,
            entryYear: parsedData.entryYear,
          },
        });

        return { user, student };
      });

      return res.status(201).json({
        message: 'Student account created. Awaiting admin approval.',
        userId: result.user.id,
        status: result.user.status,
      });
    } else if (role === 'TEACHER') {
      // Teachers can sign up but need admin approval
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          role: UserRole.TEACHER,
          status: UserStatus.PENDING_ADMIN_APPROVAL,
        },
      });

      return res.status(201).json({
        message: 'Teacher account created. Awaiting admin approval.',
        userId: user.id,
        status: user.status,
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

export const sendOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    // Check status - only ACTIVE users can login
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({
        error: `Account is ${user.status}. Please wait for approval.`,
        status: user.status,
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);
    const otpExpiry = getOTPExpiry();

    // Store OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashedOTP,
        otpExpiry: otpExpiry,
      },
    });

    // Send OTP via email
    await sendOTPEmail(email.toLowerCase(), user.name, otp);

    res.json({
      message: 'OTP sent to your email',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
};

export const verifyOTPAndLogin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or OTP' });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiry) {
      return res.status(401).json({ error: 'No OTP found. Please request a new OTP.' });
    }

    // Check if OTP has expired
    if (isOTPExpired(user.otpExpiry)) {
      // Clear expired OTP
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpiry: null },
      });
      return res.status(401).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    // Verify OTP
    const isOTPValid = await verifyOTP(otp, user.otp);
    if (!isOTPValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Clear OTP from database after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null },
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Remove OTP fields from response
    const { otp: _, otpExpiry: __, ...userWithoutOTP } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutOTP,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
};

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

    const { otp: _, otpExpiry: __, ...userWithoutOTP } = user;
    res.json(userWithoutOTP);
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};
