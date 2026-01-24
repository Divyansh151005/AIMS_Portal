import prisma from '../config/database.js';

// Use string literals for enum values
const EnrollmentStatus = {
  PENDING_INSTRUCTOR_APPROVAL: 'PENDING_INSTRUCTOR_APPROVAL',
  PENDING_ADVISOR_APPROVAL: 'PENDING_ADVISOR_APPROVAL',
  ENROLLED: 'ENROLLED',
  REJECTED: 'REJECTED',
  DROPPED: 'DROPPED',
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
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
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get enrollment statistics
    const enrolledCount = await prisma.enrollmentRequest.count({
      where: {
        studentId: student.id,
        status: EnrollmentStatus.ENROLLED,
      },
    });

    const pendingCount = await prisma.enrollmentRequest.count({
      where: {
        studentId: student.id,
        status: {
          in: [EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL, EnrollmentStatus.PENDING_ADVISOR_APPROVAL],
        },
      },
    });

    res.json({
      student,
      stats: {
        enrolledCourses: enrolledCount,
        pendingApprovals: pendingCount,
      },
    });
  } catch (error) {
    console.error('GetStudentDashboard error:', error);
    next(error);
  }
};

export const getEnrolledCourses = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const enrollments = await prisma.enrollmentRequest.findMany({
      where: {
        studentId: student.id,
        status: {
          in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL, EnrollmentStatus.PENDING_ADVISOR_APPROVAL],
        },
      },
      include: {
        courseOffering: {
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(enrollments);
  } catch (error) {
    console.error('GetEnrolledCourses error:', error);
    next(error);
  }
};

export const getPendingApprovals = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const pending = await prisma.enrollmentRequest.findMany({
      where: {
        studentId: student.id,
        status: {
          in: [EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL, EnrollmentStatus.PENDING_ADVISOR_APPROVAL],
        },
      },
      include: {
        courseOffering: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(pending);
  } catch (error) {
    console.error('GetPendingApprovals error:', error);
    next(error);
  }
};

export const getTimetable = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get enrolled courses
    const enrolledCourses = await prisma.enrollmentRequest.findMany({
      where: {
        studentId: student.id,
        status: EnrollmentStatus.ENROLLED,
      },
      include: {
        courseOffering: true,
      },
    });

    // Build timetable from enrolled courses
    // Get base timetable slots for enrolled courses
    const timetableSlots = await prisma.timetable.findMany({
      where: {
        slot: {
          in: enrolledCourses.map((ec) => ec.courseOffering.slot),
        },
        OR: [
          { userId: null }, // General slot
          { userId: req.userId }, // Student-specific slot
        ],
      },
      include: {
        courseOffering: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Map timetable entries to course codes
    const timetable = timetableSlots.map((entry) => {
      const enrollment = enrolledCourses.find(
        (ec) => ec.courseOffering.slot === entry.slot
      );

      return {
        day: entry.day,
        timeSlot: entry.timeSlot,
        slot: entry.slot,
        courseCode: enrollment?.courseOffering.courseCode || null,
        courseTitle: enrollment?.courseOffering.courseTitle || null,
        instructor: enrollment?.courseOffering.instructor?.user?.name || null,
      };
    });

    res.json(timetable);
  } catch (error) {
    console.error('GetTimetable error:', error);
    next(error);
  }
};

export const getGrades = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
        isPublished: true,
      },
      include: {
        courseOffering: {
          include: {
            instructor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(grades);
  } catch (error) {
    console.error('GetGrades error:', error);
    next(error);
  }
};
