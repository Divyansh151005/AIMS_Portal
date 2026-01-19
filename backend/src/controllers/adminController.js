import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

// Use string literals for enum values
const UserStatus = {
  ACTIVE: 'ACTIVE',
  PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE',
};
import { hashPassword } from '../utils/auth.js';
import { sendStudentApprovalEmail } from '../config/email.js';

export const getDashboard = async (req, res, next) => {
  try {
    const pendingStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        status: UserStatus.PENDING_ADMIN_APPROVAL,
      },
    });

    const pendingTeachers = await prisma.user.count({
      where: {
        role: 'TEACHER',
        status: UserStatus.PENDING_ADMIN_APPROVAL,
      },
    });

    const pendingCourses = await prisma.courseOffering.count({
      where: { isApproved: false },
    });

    const activeStudents = await prisma.user.count({
      where: {
        role: 'STUDENT',
        status: UserStatus.ACTIVE,
      },
    });

    const activeTeachers = await prisma.user.count({
      where: {
        role: 'TEACHER',
        status: UserStatus.ACTIVE,
      },
    });

    res.json({
      stats: {
        pendingStudents,
        pendingTeachers,
        pendingCourses,
        activeStudents,
        activeTeachers,
      },
    });
  } catch (error) {
    console.error('GetDashboard error:', error);
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const stats = {
      totalStudents: await prisma.user.count({ where: { role: 'STUDENT' } }),
      activeStudents: await prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      pendingStudents: await prisma.user.count({ where: { role: 'STUDENT', status: 'PENDING_ADMIN_APPROVAL' } }),
      totalTeachers: await prisma.user.count({ where: { role: 'TEACHER' } }),
      activeTeachers: await prisma.user.count({ where: { role: 'TEACHER', status: 'ACTIVE' } }),
      totalCourses: await prisma.courseOffering.count(),
      approvedCourses: await prisma.courseOffering.count({ where: { isApproved: true } }),
      pendingCourses: await prisma.courseOffering.count({ where: { isApproved: false } }),
      totalEnrollments: await prisma.enrollmentRequest.count(),
    };

    res.json(stats);
  } catch (error) {
    console.error('GetSystemStats error:', error);
    next(error);
  }
};

export const getPendingStudentApprovals = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: UserStatus.PENDING_ADMIN_APPROVAL,
      },
      include: {
        student: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(students);
  } catch (error) {
    console.error('GetPendingStudentApprovals error:', error);
    next(error);
  }
};

export const getPendingTeacherApprovals = async (req, res, next) => {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        status: UserStatus.PENDING_ADMIN_APPROVAL,
      },
      include: {
        teacher: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(teachers);
  } catch (error) {
    console.error('GetPendingTeacherApprovals error:', error);
    next(error);
  }
};

export const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teacher: true,
      },
    });

    if (!user || user.role !== 'TEACHER') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (user.status !== UserStatus.PENDING_ADMIN_APPROVAL) {
      return res.status(400).json({ error: 'Teacher is not pending approval' });
    }

    // If teacher record doesn't exist, create it
    if (!user.teacher) {
      // This shouldn't happen for signup teachers, but handle it
      await prisma.teacher.create({
        data: {
          userId: user.id,
          department: 'TBD', // Default department if missing from signup
        },
      });
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
      },
      include: {
        teacher: true,
      },
    });

    res.json({
      message: 'Teacher approved successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ApproveTeacher error:', error);
    next(error);
  }
};

export const rejectTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== 'TEACHER') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (user.status !== UserStatus.PENDING_ADMIN_APPROVAL) {
      return res.status(400).json({ error: 'Teacher is not pending approval' });
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.REJECTED,
      },
    });

    res.json({
      message: 'Teacher rejected',
      user: updatedUser,
    });
  } catch (error) {
    console.error('RejectTeacher error:', error);
    next(error);
  }
};

export const approveStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!user || user.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.status !== UserStatus.PENDING_ADMIN_APPROVAL) {
      return res.status(400).json({ error: 'Student is not pending approval' });
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
      },
      include: {
        student: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Send email
    try {
      await sendStudentApprovalEmail(user.email, user.name, true);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Student approved successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ApproveStudent error:', error);
    next(error);
  }
};

export const rejectStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.status !== UserStatus.PENDING_ADMIN_APPROVAL) {
      return res.status(400).json({ error: 'Student is not pending approval' });
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.REJECTED,
      },
    });

    // Send email
    try {
      await sendStudentApprovalEmail(user.email, user.name, false);
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Student rejected',
      user: updatedUser,
    });
  } catch (error) {
    console.error('RejectStudent error:', error);
    next(error);
  }
};

export const assignAdvisor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { advisorId } = req.body;

    // Check student
    const student = await prisma.student.findUnique({
      where: { userId: id },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id: advisorId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Assign advisor
    const updatedStudent = await prisma.student.update({
      where: { userId: id },
      data: {
        advisorId,
      },
      include: {
        advisor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Advisor assigned successfully',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('AssignAdvisor error:', error);
    next(error);
  }
};

export const getTeachers = async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        advisedStudents: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(teachers);
  } catch (error) {
    console.error('GetTeachers error:', error);
    next(error);
  }
};

export const getAllTeachers = getTeachers;

export const createTeacher = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, password, department } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and teacher in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
          role: 'TEACHER',
          status: UserStatus.ACTIVE, // Teachers created by admin are automatically active
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          department,
        },
      });

      return { user, teacher };
    });

    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        ...result.teacher,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('CreateTeacher error:', error);
    next(error);
  }
};

export const removeTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Delete teacher (cascade will handle related records)
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    res.json({
      message: 'Teacher removed successfully',
    });
  } catch (error) {
    console.error('RemoveTeacher error:', error);
    next(error);
  }
};

export const getAllStudents = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        student: {
          include: {
            advisor: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(students);
  } catch (error) {
    console.error('GetAllStudents error:', error);
    next(error);
  }
};

export const getPendingCourseApprovals = async (req, res, next) => {
  try {
    const courses = await prisma.courseOffering.findMany({
      where: { isApproved: false },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(courses);
  } catch (error) {
    console.error('GetPendingCourseApprovals error:', error);
    next(error);
  }
};

export const approveCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.courseOffering.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    if (course.isApproved) {
      return res.status(400).json({ error: 'Course is already approved' });
    }

    // Approve course
    const updatedCourse = await prisma.courseOffering.update({
      where: { id },
      data: {
        isApproved: true,
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: 'Course approved successfully',
      courseOffering: updatedCourse,
    });
  } catch (error) {
    console.error('ApproveCourse error:', error);
    next(error);
  }
};

export const rejectCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await prisma.courseOffering.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Delete course offering (or mark as rejected - implementation depends on requirements)
    await prisma.courseOffering.delete({
      where: { id },
    });

    res.json({
      message: 'Course offering rejected and removed',
    });
  } catch (error) {
    console.error('RejectCourse error:', error);
    next(error);
  }
};
