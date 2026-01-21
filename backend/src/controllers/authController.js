import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { parseStudentEmail } from '../utils/emailParser.js';

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

    const { name, email, password, role } = req.body;

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

    // Hash password
    const hashedPassword = await hashPassword(password);

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
            password: hashedPassword,
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
          password: hashedPassword,
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

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check status - only ACTIVE users can login
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
    console.error('Login error:', error);
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

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};
