import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { sendEnrollmentStatusEmail } from '../config/email.js';

// Use string literals for enum values
const EnrollmentStatus = {
  PENDING_INSTRUCTOR_APPROVAL: 'PENDING_INSTRUCTOR_APPROVAL',
  PENDING_ADVISOR_APPROVAL: 'PENDING_ADVISOR_APPROVAL',
  ENROLLED: 'ENROLLED',
  REJECTED: 'REJECTED',
  DROPPED: 'DROPPED',
};

export const enrollInCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseOfferingId } = req.body;

    // Get student
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get course offering
    const courseOffering = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
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

    if (!courseOffering) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    // Check if course is approved
    if (!courseOffering.isApproved) {
      return res.status(400).json({ error: 'Course offering is not approved yet' });
    }

    // Check eligibility
    if (courseOffering.allowedBranches.length > 0 && !courseOffering.allowedBranches.includes(student.branch)) {
      return res.status(403).json({ error: 'You are not eligible for this course (branch restriction)' });
    }

    if (courseOffering.allowedYears.length > 0 && !courseOffering.allowedYears.includes(student.entryYear)) {
      return res.status(403).json({ error: 'You are not eligible for this course (entry year restriction)' });
    }

    // Check slot conflict
    const existingEnrollment = await prisma.enrollmentRequest.findFirst({
      where: {
        studentId: student.id,
        status: {
          in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL, EnrollmentStatus.PENDING_ADVISOR_APPROVAL],
        },
      },
      include: {
        courseOffering: true,
      },
    });

    if (existingEnrollment && existingEnrollment.courseOffering.slot === courseOffering.slot) {
      return res.status(409).json({
        error: `Slot conflict: You already have a course in slot ${courseOffering.slot}`,
        conflictingCourse: existingEnrollment.courseOffering.courseCode,
      });
    }

    // Check if already enrolled or requested
    const existingRequest = await prisma.enrollmentRequest.findUnique({
      where: {
        studentId_courseOfferingId: {
          studentId: student.id,
          courseOfferingId: courseOffering.id,
        },
      },
    });

    if (existingRequest && existingRequest.status === EnrollmentStatus.ENROLLED) {
      return res.status(409).json({ error: 'You are already enrolled in this course' });
    }

    if (existingRequest && existingRequest.status !== EnrollmentStatus.DROPPED) {
      return res.status(409).json({ error: 'You already have a pending request for this course' });
    }

    // Create or update enrollment request
    const enrollmentRequest = await prisma.enrollmentRequest.upsert({
      where: {
        studentId_courseOfferingId: {
          studentId: student.id,
          courseOfferingId: courseOffering.id,
        },
      },
      update: {
        status: EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL,
        droppedAt: null,
      },
      create: {
        studentId: student.id,
        courseOfferingId: courseOffering.id,
        status: EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL,
      },
      include: {
        courseOffering: true,
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
    });

    // Send email to student
    try {
      await sendEnrollmentStatusEmail(
        student.user.email,
        student.user.name,
        courseOffering.courseCode,
        courseOffering.courseTitle,
        EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL,
        'STUDENT'
      );
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Enrollment request submitted. Awaiting instructor approval.',
      enrollmentRequest,
    });
  } catch (error) {
    console.error('EnrollInCourse error:', error);
    next(error);
  }
};

export const dropCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
      include: {
        courseOffering: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    if (enrollment.studentId !== student.id) {
      return res.status(403).json({ error: 'You can only drop your own enrollments' });
    }

    if (enrollment.status === EnrollmentStatus.DROPPED) {
      return res.status(400).json({ error: 'Course already dropped' });
    }

    // Update enrollment status
    const updatedEnrollment = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: EnrollmentStatus.DROPPED,
        droppedAt: new Date(),
      },
      include: {
        courseOffering: true,
      },
    });

    // Send email
    try {
      await sendEnrollmentStatusEmail(
        student.user.email,
        student.user.name,
        updatedEnrollment.courseOffering.courseCode,
        updatedEnrollment.courseOffering.courseTitle,
        EnrollmentStatus.DROPPED,
        'STUDENT'
      );
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Course dropped successfully',
      enrollmentRequest: updatedEnrollment,
    });
  } catch (error) {
    console.error('DropCourse error:', error);
    next(error);
  }
};

export const getMyEnrollments = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const enrollments = await prisma.enrollmentRequest.findMany({
      where: { studentId: student.id },
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

    res.json(enrollments);
  } catch (error) {
    console.error('GetMyEnrollments error:', error);
    next(error);
  }
};

export const approveInstructorEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get enrollment request
    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
      include: {
        courseOffering: {
          include: {
            instructor: true,
          },
        },
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
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

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    // Check if teacher is the instructor
    if (enrollment.courseOffering.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only approve enrollments for your own courses' });
    }

    if (enrollment.status !== EnrollmentStatus.PENDING_INSTRUCTOR_APPROVAL) {
      return res.status(400).json({ error: 'Enrollment is not pending instructor approval' });
    }

    // Update status
    const updatedEnrollment = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: EnrollmentStatus.PENDING_ADVISOR_APPROVAL,
        instructorApprovedAt: new Date(),
      },
    });

    // Send emails
    try {
      await sendEnrollmentStatusEmail(
        enrollment.student.user.email,
        enrollment.student.user.name,
        enrollment.courseOffering.courseCode,
        enrollment.courseOffering.courseTitle,
        EnrollmentStatus.PENDING_ADVISOR_APPROVAL,
        'STUDENT'
      );

      if (enrollment.student.advisor) {
        await sendEnrollmentStatusEmail(
          enrollment.student.advisor.user.email,
          enrollment.student.advisor.user.name,
          enrollment.courseOffering.courseCode,
          enrollment.courseOffering.courseTitle,
          EnrollmentStatus.PENDING_ADVISOR_APPROVAL,
          'ADVISOR'
        );
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Enrollment approved. Awaiting advisor approval.',
      enrollmentRequest: updatedEnrollment,
    });
  } catch (error) {
    console.error('ApproveInstructorEnrollment error:', error);
    next(error);
  }
};

export const approveAdvisorEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get teacher (acting as advisor)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get enrollment request
    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
      include: {
        courseOffering: true,
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            advisor: true,
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    // Check if teacher is the advisor
    if (!enrollment.student.advisorId || enrollment.student.advisorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only approve enrollments for students assigned to you' });
    }

    if (enrollment.status !== EnrollmentStatus.PENDING_ADVISOR_APPROVAL) {
      return res.status(400).json({ error: 'Enrollment is not pending advisor approval' });
    }

    // Update status to enrolled
    const updatedEnrollment = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: EnrollmentStatus.ENROLLED,
        advisorApprovedAt: new Date(),
        enrolledAt: new Date(),
      },
    });

    // Send email
    try {
      await sendEnrollmentStatusEmail(
        enrollment.student.user.email,
        enrollment.student.user.name,
        enrollment.courseOffering.courseCode,
        enrollment.courseOffering.courseTitle,
        EnrollmentStatus.ENROLLED,
        'STUDENT'
      );
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Enrollment confirmed. Student is now enrolled.',
      enrollmentRequest: updatedEnrollment,
    });
  } catch (error) {
    console.error('ApproveAdvisorEnrollment error:', error);
    next(error);
  }
};

export const rejectEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get enrollment request
    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
      include: {
        courseOffering: true,
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
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }

    // Check permissions
    if (req.userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.userId },
      });

      if (enrollment.courseOffering.instructorId !== teacher.id) {
        return res.status(403).json({ error: 'You can only reject enrollments for your own courses' });
      }
    }

    if (enrollment.status === EnrollmentStatus.ENROLLED || enrollment.status === EnrollmentStatus.DROPPED) {
      return res.status(400).json({ error: 'Cannot reject this enrollment' });
    }

    // Update status
    const updatedEnrollment = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: EnrollmentStatus.REJECTED,
      },
    });

    // Send email
    try {
      await sendEnrollmentStatusEmail(
        enrollment.student.user.email,
        enrollment.student.user.name,
        enrollment.courseOffering.courseCode,
        enrollment.courseOffering.courseTitle,
        EnrollmentStatus.REJECTED,
        'STUDENT'
      );
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.json({
      message: 'Enrollment rejected',
      enrollmentRequest: updatedEnrollment,
    });
  } catch (error) {
    console.error('RejectEnrollment error:', error);
    next(error);
  }
};
