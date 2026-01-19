import prisma from '../config/database.js';

// Use string literals for enum values
const EnrollmentStatus = {
  PENDING_INSTRUCTOR_APPROVAL: 'PENDING_INSTRUCTOR_APPROVAL',
  PENDING_ADVISOR_APPROVAL: 'PENDING_ADVISOR_APPROVAL',
  ENROLLED: 'ENROLLED',
  REJECTED: 'REJECTED',
  DROPPED: 'DROPPED',
};

export const getTeacherDashboard = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get statistics
    const courseCount = await prisma.courseOffering.count({
      where: { instructorId: teacher.id },
    });

    const pendingEnrollments = await prisma.enrollmentRequest.count({
      where: {
        courseOffering: {
          instructorId: teacher.id,
        },
        status: EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL,
      },
    });

    const advisedStudents = await prisma.student.count({
      where: { advisorId: teacher.id },
    });

    res.json({
      teacher,
      stats: {
        courseCount,
        pendingEnrollments,
        advisedStudents,
      },
    });
  } catch (error) {
    console.error('GetTeacherDashboard error:', error);
    next(error);
  }
};

export const getEnrollmentRequests = async (req, res, next) => {
  try {
    const { status } = req.query;

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const where = {
      courseOffering: {
        instructorId: teacher.id,
      },
    };

    if (status) {
      where.status = status;
    }

    const enrollments = await prisma.enrollmentRequest.findMany({
      where,
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
        courseOffering: {
          select: {
            id: true,
            courseCode: true,
            courseTitle: true,
            slot: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Also get enrollments pending advisor approval for students advised by this teacher
    const advisedEnrollments = await prisma.enrollmentRequest.findMany({
      where: {
        status: EnrollmentStatus.PENDING_ADVISOR_APPROVAL,
        student: {
          advisorId: teacher.id,
        },
      },
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
        courseOffering: {
          select: {
            id: true,
            courseCode: true,
            courseTitle: true,
            slot: true,
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
        createdAt: 'desc',
      },
    });

    res.json({
      instructorEnrollments: enrollments,
      advisorEnrollments: advisedEnrollments,
    });
  } catch (error) {
    console.error('GetEnrollmentRequests error:', error);
    next(error);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const courses = await prisma.courseOffering.findMany({
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
    console.error('GetMyCourses error:', error);
    next(error);
  }
};

export const getTimetable = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get teacher's approved courses
    const courses = await prisma.courseOffering.findMany({
      where: {
        instructorId: teacher.id,
        isApproved: true,
      },
    });

    // Build timetable from course slots
    const timetableSlots = await prisma.timetable.findMany({
      where: {
        slot: {
          in: courses.map((c) => c.slot),
        },
      },
    });

    // Map timetable entries to course codes
    const timetable = timetableSlots.map((entry) => {
      const course = courses.find((c) => c.slot === entry.slot);

      return {
        day: entry.day,
        timeSlot: entry.timeSlot,
        slot: entry.slot,
        courseCode: course?.courseCode || null,
        courseTitle: course?.courseTitle || null,
      };
    });

    res.json(timetable);
  } catch (error) {
    console.error('GetTimetable error:', error);
    next(error);
  }
};
