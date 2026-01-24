import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

export const assignGrade = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, courseOfferingId, grade, marks } = req.body;

    // Get teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify course belongs to teacher
    const course = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    if (course.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only assign grades for your own courses' });
    }

    // Verify student is enrolled
    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: {
        studentId_courseOfferingId: {
          studentId,
          courseOfferingId,
        },
      },
    });

    if (!enrollment) {
      return res.status(400).json({ error: 'Student enrollment not found for this course' });
    }
    
    if (enrollment.status !== 'ENROLLED') {
      return res.status(400).json({ 
        error: `Student is not enrolled in this course. Current status: ${enrollment.status}` 
      });
    }

    // Normalize grade and marks values
    const gradeValue = (grade && typeof grade === 'string' && grade.trim()) || null;
    let marksValue = null;
    if (marks !== undefined && marks !== null && marks !== '') {
      const parsed = parseFloat(marks);
      if (!isNaN(parsed)) {
        marksValue = parsed;
      }
    }
    
    // Validate marks if provided
    if (marksValue !== null && (marksValue < 0 || marksValue > 100)) {
      return res.status(400).json({ error: 'Marks must be a number between 0 and 100' });
    }
    
    console.log('Assigning grade:', { studentId, courseOfferingId, gradeValue, marksValue, teacherId: teacher.id });

    // Create or update grade
    const gradeRecord = await prisma.grade.upsert({
      where: {
        studentId_courseOfferingId: {
          studentId,
          courseOfferingId,
        },
      },
      update: {
        grade: gradeValue,
        marks: marksValue,
        isPublished: false, // Reset published status on update
      },
      create: {
        studentId,
        courseOfferingId,
        teacherId: teacher.id,
        grade: gradeValue,
        marks: marksValue,
        isPublished: false,
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
            courseCode: true,
            courseTitle: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Grade assigned successfully',
      grade: gradeRecord,
    });
  } catch (error) {
    console.error('AssignGrade error:', error);
    next(error);
  }
};

export const updateGrade = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { grade, marks } = req.body;

    // Get grade record
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
      include: {
        courseOffering: true,
      },
    });

    if (!existingGrade) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    // Check if teacher owns the course
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (existingGrade.courseOffering.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only update grades for your own courses' });
    }

    // Normalize grade and marks values
    let gradeValue = existingGrade.grade;
    if (grade !== undefined) {
      gradeValue = (grade && typeof grade === 'string' && grade.trim()) || null;
    }
    
    let marksValue = existingGrade.marks;
    if (marks !== undefined) {
      if (marks === null || marks === '') {
        marksValue = null;
      } else {
        const parsed = parseFloat(marks);
        if (isNaN(parsed)) {
          return res.status(400).json({ error: 'Marks must be a valid number' });
        }
        if (parsed < 0 || parsed > 100) {
          return res.status(400).json({ error: 'Marks must be a number between 0 and 100' });
        }
        marksValue = parsed;
      }
    }
    
    console.log('Updating grade:', { id, gradeValue, marksValue });

    // Update grade
    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        grade: gradeValue,
        marks: marksValue,
        isPublished: false, // Reset published status on update
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
            courseCode: true,
            courseTitle: true,
          },
        },
      },
    });

    res.json({
      message: 'Grade updated successfully',
      grade: updatedGrade,
    });
  } catch (error) {
    console.error('UpdateGrade error:', error);
    next(error);
  }
};

export const publishGrade = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get grade record
    const existingGrade = await prisma.grade.findUnique({
      where: { id },
      include: {
        courseOffering: true,
      },
    });

    if (!existingGrade) {
      return res.status(404).json({ error: 'Grade not found' });
    }

    // Check if teacher owns the course
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (existingGrade.courseOffering.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only publish grades for your own courses' });
    }

    // Publish grade
    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        isPublished: true,
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
            courseCode: true,
            courseTitle: true,
          },
        },
      },
    });

    res.json({
      message: 'Grade published successfully. Students can now view this grade.',
      grade: updatedGrade,
    });
  } catch (error) {
    console.error('PublishGrade error:', error);
    next(error);
  }
};

export const getGradesByCourse = async (req, res, next) => {
  try {
    const { courseOfferingId } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.userId },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify course belongs to teacher
    const course = await prisma.courseOffering.findUnique({
      where: { id: courseOfferingId },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course offering not found' });
    }

    if (course.instructorId !== teacher.id) {
      return res.status(403).json({ error: 'You can only view grades for your own courses' });
    }

    // Get all grades for this course
    const grades = await prisma.grade.findMany({
      where: { courseOfferingId },
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
      orderBy: {
        student: {
          user: {
            email: 'asc',
          },
        },
      },
    });

    res.json(grades);
  } catch (error) {
    console.error('GetGradesByCourse error:', error);
    next(error);
  }
};

export const getStudentGrades = async (req, res, next) => {
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
    console.error('GetStudentGrades error:', error);
    next(error);
  }
};
