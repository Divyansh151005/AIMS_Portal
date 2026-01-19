import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { calculateCredits } from '../utils/creditCalculator.js';

export const createCourseOffering = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      courseCode,
      courseTitle,
      department,
      semester,
      courseType,
      slot,
      allowedBranches,
      allowedYears,
      L,
      P,
      syllabus,
    } = req.body;

    // Convert L and P to integers (they might come as strings from form data)
    const L_int = parseInt(L, 10);
    const P_int = parseInt(P, 10);

    if (isNaN(L_int) || isNaN(P_int)) {
      return res.status(400).json({ error: 'L and P must be valid integers' });
    }

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Calculate credits
    const { T, S, C } = calculateCredits(L_int, P_int);

    // Create course offering
    const courseOffering = await prisma.courseOffering.create({
      data: {
        courseCode,
        courseTitle,
        department,
        semester,
        courseType,
        slot,
        allowedBranches: allowedBranches || [],
        allowedYears: allowedYears || [],
        L: L_int,
        P: P_int,
        T,
        S,
        C,
        syllabus: syllabus || null,
        instructorId: teacher.id,
        isApproved: false,
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

    res.status(201).json({
      message: 'Course offering created. Awaiting admin approval.',
      courseOffering,
    });
  } catch (error) {
    console.error('CreateCourseOffering error:', error);
    next(error);
  }
};

export const getMyCourseOfferings = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const courseOfferings = await prisma.courseOffering.findMany({
      where: { instructorId: teacher.id },
      include: {
        enrollmentRequests: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              select: {
                rollNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(courseOfferings);
  } catch (error) {
    console.error('GetMyCourseOfferings error:', error);
    next(error);
  }
};

export const getApprovedCourses = async (req, res, next) => {
  try {
    const { semester, branch, entryYear } = req.query;

    const where = {
      isApproved: true,
    };

    if (semester) {
      where.semester = semester;
    }

    const courses = await prisma.courseOffering.findMany({
      where,
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
        courseCode: 'asc',
      },
    });

    // Filter by branch and entry year if provided
    let filteredCourses = courses;
    if (branch || entryYear) {
      filteredCourses = courses.filter((course) => {
        const branchMatch = !branch || course.allowedBranches.length === 0 || course.allowedBranches.includes(branch);
        const yearMatch = !entryYear || course.allowedYears.length === 0 || course.allowedYears.includes(parseInt(entryYear));
        return branchMatch && yearMatch;
      });
    }

    res.json(filteredCourses);
  } catch (error) {
    console.error('GetApprovedCourses error:', error);
    next(error);
  }
};

export const getCourseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id },
      include: {
        instructor: {
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
        enrollmentRequests: {
          include: {
            student: {
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

    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    res.json(courseOffering);
  } catch (error) {
    console.error('GetCourseDetails error:', error);
    next(error);
  }
};

export const updateCourseOffering = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      courseCode,
      courseTitle,
      department,
      semester,
      courseType,
      slot,
      allowedBranches,
      allowedYears,
      L,
      P,
      syllabus,
    } = req.body;

    // Convert L and P to integers (they might come as strings from form data)
    const L_int = parseInt(L, 10);
    const P_int = parseInt(P, 10);

    if (isNaN(L_int) || isNaN(P_int)) {
      return res.status(400).json({ error: 'L and P must be valid integers' });
    }

    // Check if course offering exists and belongs to teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const existingCourse = await prisma.courseOffering.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    if (existingCourse.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only update your own course offerings' });
    }

    // If approved, cannot update
    if (existingCourse.isApproved) {
      return res.status(400).json({ error: 'Cannot update approved course offering' });
    }

    // Calculate credits
    const { T, S, C } = calculateCredits(L_int, P_int);

    // Update course offering
    const updatedCourse = await prisma.courseOffering.update({
      where: { id },
      data: {
        courseCode,
        courseTitle,
        department,
        semester,
        courseType,
        slot,
        allowedBranches: allowedBranches || [],
        allowedYears: allowedYears || [],
        L: L_int,
        P: P_int,
        T,
        S,
        C,
        syllabus: syllabus || null,
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
      message: 'Course offering updated',
      courseOffering: updatedCourse,
    });
  } catch (error) {
    console.error('UpdateCourseOffering error:', error);
    next(error);
  }
};
