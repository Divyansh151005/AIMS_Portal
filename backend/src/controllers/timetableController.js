import prisma from '../config/database.js';

// Timetable structure based on the image:
// Days: Monday (0) to Saturday (5)
// Time slots:
// 0: 8:00-8:50
// 1: 9:00-9:50
// 2: 10:00-10:50
// 3: 11:00-11:50
// 4: 12:00-12:50
// 5: Lunch Break (12:50-2:00)
// 6: 2:00-2:50
// 7: 3:00-3:50
// 8: 4:00-4:50
// 9: 5:00-5:50
// 10: 6:00-6:50

const TIMETABLE_STRUCTURE = [
  // Monday
  [
    { slot: 'PCPE', timeSlots: [0] }, // 8:00-8:50
    { slot: 'PC1', timeSlots: [1] }, // 9:00-9:50
    { slot: 'PC2', timeSlots: [2] }, // 10:00-10:50
    { slot: 'PC3', timeSlots: [3] }, // 11:00-11:50
    { slot: 'PC4', timeSlots: [4] }, // 12:00-12:50
    { slot: 'HSME', timeSlots: [6] }, // 2:00-2:50
    { slot: 'PCPE', timeSlots: [7] }, // 3:00-3:50
    { slot: 'HSPE', timeSlots: [8] }, // 4:00-4:50
    { slot: 'PHSME', timeSlots: [9] }, // 5:00-5:50
    { slot: 'PEOE', timeSlots: [10] }, // 6:00-6:50 (T-PCOE maps to PEOE)
  ],
  // Tuesday
  [
    { slot: 'HSPE', timeSlots: [0] }, // 8:00-8:50
    { slot: 'PC1', timeSlots: [1] }, // 9:00-9:50
    { slot: 'PC2', timeSlots: [2] }, // 10:00-10:50
    { slot: 'PC3', timeSlots: [3] }, // 11:00-11:50
    { slot: 'PC4', timeSlots: [4] }, // 12:00-12:50
    { slot: 'PCDE', timeSlots: [6] }, // 2:00-2:50
    { slot: 'PEOE', timeSlots: [7] }, // 3:00-3:50
    { slot: 'HSPE', timeSlots: [8] }, // 4:00-4:50
    { slot: 'PHSME', timeSlots: [9] }, // 5:00-5:50
    { slot: 'PEOE', timeSlots: [10] }, // 6:00-6:50
  ],
  // Wednesday
  [
    { slot: 'PCDE', timeSlots: [0] }, // 8:00-8:50
    { slot: 'PC1', timeSlots: [1] }, // 9:00-9:50
    { slot: 'PC2', timeSlots: [2] }, // 10:00-10:50
    { slot: 'PC3', timeSlots: [3] }, // 11:00-11:50
    { slot: 'PC4', timeSlots: [4] }, // 12:00-12:50
    { slot: 'PCE1', timeSlots: [6] }, // 2:00-2:50
    { slot: 'PCE2', timeSlots: [7] }, // 3:00-3:50
    { slot: 'PCE3', timeSlots: [8] }, // 4:00-4:50
    { slot: 'PHSME', timeSlots: [9] }, // 5:00-5:50
    { slot: 'HSME', timeSlots: [10] }, // 6:00-6:50
  ],
  // Thursday
  [
    { slot: 'PHSME', timeSlots: [0] }, // 8:00-8:50
    { slot: 'PCPE', timeSlots: [1] }, // 9:00-9:50
    { slot: 'HSME', timeSlots: [2] }, // 10:00-10:50
    { slot: 'PCDE', timeSlots: [3] }, // 11:00-11:50
    { slot: 'PEOE', timeSlots: [4] }, // 12:00-12:50
    { slot: 'PCE1', timeSlots: [6] }, // 2:00-2:50
    { slot: 'PCE2', timeSlots: [7] }, // 3:00-3:50
    { slot: 'PCE3', timeSlots: [8] }, // 4:00-4:50
    { slot: 'HSME', timeSlots: [9] }, // 5:00-5:50 (Seminar - using HSME slot)
    { slot: 'PC4', timeSlots: [10] }, // 6:00-6:50
  ],
  // Friday
  [
    { slot: 'PEOE', timeSlots: [0] }, // 8:00-8:50
    { slot: 'PCPE', timeSlots: [1] }, // 9:00-9:50
    { slot: 'HSME', timeSlots: [2] }, // 10:00-10:50
    { slot: 'PCDE', timeSlots: [3] }, // 11:00-11:50
    { slot: 'PEOE', timeSlots: [4] }, // 12:00-12:50
    { slot: 'PCE1', timeSlots: [6] }, // 2:00-2:50
    { slot: 'PCE2', timeSlots: [7] }, // 3:00-3:50
    { slot: 'PCE3', timeSlots: [8] }, // 4:00-4:50
    { slot: 'HSPE', timeSlots: [9] }, // 5:00-5:50
    { slot: 'PCDE', timeSlots: [10] }, // 6:00-6:50 (T-PMS maps to PCDE)
  ],
  // Saturday
  [
    // Empty by default
  ],
];

export const initializeTimetable = async (req, res, next) => {
  try {
    // Clear existing timetable
    await prisma.timetable.deleteMany({});

    // Create timetable entries
    const entries = [];

    for (let day = 0; day < TIMETABLE_STRUCTURE.length; day++) {
      const daySlots = TIMETABLE_STRUCTURE[day];
      for (const slotEntry of daySlots) {
        for (const timeSlot of slotEntry.timeSlots) {
          entries.push({
            day,
            timeSlot,
            slot: slotEntry.slot,
            userId: null, // General timetable
          });
        }
      }
    }

    // Batch create
    await prisma.timetable.createMany({
      data: entries,
      skipDuplicates: true,
    });

    res.json({
      message: 'Timetable initialized successfully',
      entriesCount: entries.length,
    });
  } catch (error) {
    console.error('InitializeTimetable error:', error);
    next(error);
  }
};

export const getTimetable = async (req, res, next) => {
  try {
    let timetableEntries;

    if (req.userRole === 'STUDENT') {
      // Get student's enrolled courses
      const student = await prisma.student.findUnique({
        where: { userId: req.userId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const enrolledCourses = await prisma.enrollmentRequest.findMany({
        where: {
          studentId: student.id,
          status: 'ENROLLED',
        },
        include: {
          courseOffering: true,
        },
      });

      // Get timetable slots for enrolled courses
      const slots = enrolledCourses.map((ec) => ec.courseOffering.slot);

      timetableEntries = await prisma.timetable.findMany({
        where: {
          slot: {
            in: slots,
          },
          OR: [
            { userId: null },
            { userId: req.userId },
          ],
        },
      });

      // Map to include course codes
      const timetable = timetableEntries.map((entry) => {
        const enrollment = enrolledCourses.find(
          (ec) => ec.courseOffering.slot === entry.slot
        );

        return {
          ...entry,
          courseCode: enrollment?.courseOffering.courseCode || null,
          courseTitle: enrollment?.courseOffering.courseTitle || null,
        };
      });

      return res.json(timetable);
    } else if (req.userRole === 'TEACHER') {
      // Get teacher's courses
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.userId },
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      const courses = await prisma.courseOffering.findMany({
        where: {
          instructorId: teacher.id,
          isApproved: true,
        },
      });

      const slots = courses.map((c) => c.slot);

      timetableEntries = await prisma.timetable.findMany({
        where: {
          slot: {
            in: slots,
          },
        },
      });

      // Map to include course codes
      const timetable = timetableEntries.map((entry) => {
        const course = courses.find((c) => c.slot === entry.slot);

        return {
          ...entry,
          courseCode: course?.courseCode || null,
          courseTitle: course?.courseTitle || null,
        };
      });

      return res.json(timetable);
    } else {
      // Admin - return all timetable
      timetableEntries = await prisma.timetable.findMany({
        where: { userId: null },
      });

      return res.json(timetableEntries);
    }
  } catch (error) {
    console.error('GetTimetable error:', error);
    next(error);
  }
};
