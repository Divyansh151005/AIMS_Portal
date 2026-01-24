import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Admin credentials
    const adminEmail = '2023csb1147@iitrpr.ac.in';
    const adminPassword = 'Admin@123';
    const adminName = 'System Administrator';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { password: hashedPassword, role: 'ADMIN', status: 'ACTIVE', name: adminName },
        create: { email: adminEmail, name: adminName, password: hashedPassword, role: 'ADMIN', status: 'ACTIVE' },
    });
    console.log(`✅ Admin user configured: ${adminEmail}`);

    // Helper to create user if not exists
    const upsertUser = async (email, name, role, status = 'ACTIVE') => {
        const hashedPassword = await bcrypt.hash('Password@123', 10);
        return prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword, role, status, name },
            create: { email, name, password: hashedPassword, role, status },
        });
    };

    // 2. Create Teachers
    const teachersData = [
        { email: 'teacher.cse@iitrpr.ac.in', name: 'Dr. Alan Turing', dept: 'CSE' },
        { email: 'teacher.ece@iitrpr.ac.in', name: 'Dr. Heinrich Hertz', dept: 'ECE' },
        { email: 'teacher.math@iitrpr.ac.in', name: 'Dr. Srinivasa Ramanujan', dept: 'Mathematics' },
    ];

    const teachers = [];
    for (const t of teachersData) {
        const user = await upsertUser(t.email, t.name, 'TEACHER');
        const teacher = await prisma.teacher.upsert({
            where: { userId: user.id },
            update: { department: t.dept },
            create: { userId: user.id, department: t.dept },
        });
        teachers.push({ ...teacher, email: t.email }); // Keep email for reference
        console.log(`✅ Teacher configured: ${t.email}`);
    }

    // 3. Create Students
    const studentsData = [
        { email: 'student.cse1@iitrpr.ac.in', name: 'Alice Smith', roll: '2023CSB1001', branch: 'CSE', year: 2023 },
        { email: 'student.cse2@iitrpr.ac.in', name: 'Bob Jones', roll: '2023CSB1002', branch: 'CSE', year: 2023 },
        { email: 'student.ece1@iitrpr.ac.in', name: 'Charlie Brown', roll: '2023ECB1001', branch: 'ECE', year: 2023 },
    ];

    const students = [];
    for (const s of studentsData) {
        const user = await upsertUser(s.email, s.name, 'STUDENT');
        const student = await prisma.student.upsert({
            where: { userId: user.id },
            update: { rollNumber: s.roll, branch: s.branch, entryYear: s.year, advisorId: teachers[0].id }, // Assign first teacher as advisor
            create: { userId: user.id, rollNumber: s.roll, branch: s.branch, entryYear: s.year, advisorId: teachers[0].id },
        });
        students.push({ ...student, email: s.email });
        console.log(`✅ Student configured: ${s.email}`);
    }

    // 4. Create Course Offerings (Spring 2025)
    // Clear existing courses for clean slate if needed, but upsert is safer. 
    // For simplicity in this demo, we'll just create them if they don't block unique constraints.
    
    const coursesData = [
        { code: 'CS101', title: 'Intro to Programming', dept: 'CSE', type: 'CORE', slot: 'PC1', instructorIdx: 0 },
        { code: 'CS201', title: 'Data Structures', dept: 'CSE', type: 'CORE', slot: 'PC2', instructorIdx: 0 },
        { code: 'EC101', title: 'Basic Electronics', dept: 'ECE', type: 'CORE', slot: 'PC3', instructorIdx: 1 },
        { code: 'MA101', title: 'Calculus', dept: 'Mathematics', type: 'SCIENCE_MATH_ELECTIVE', slot: 'PCE1', instructorIdx: 2 },
    ];

    const courses = [];
    for (const c of coursesData) {
        // Check if exists to avoid unique constraint errors on courseCode+semester if re-running
        const existing = await prisma.courseOffering.findFirst({
            where: { courseCode: c.code, semester: 'SPRING_2025' }
        });

        if (!existing) {
            const course = await prisma.courseOffering.create({
                data: {
                    courseCode: c.code,
                    courseTitle: c.title,
                    department: c.dept,
                    semester: 'SPRING_2025',
                    courseType: c.type,
                    slot: c.slot,
                    allowedBranches: ['CSE', 'ECE', 'MNC'],
                    allowedYears: [2023, 2024],
                    L: 3, P: 0, T: 1, S: 5, C: 3,
                    isApproved: true,
                    instructorId: teachers[c.instructorIdx].id
                }
            });
            courses.push(course);
            console.log(`✅ Course created: ${c.code}`);
        } else {
            courses.push(existing);
            console.log(`ℹ️ Course already exists: ${c.code}`);
        }
    }

    // 5. Create Enrollments
    if (students.length > 0 && courses.length > 0) {
        // Student 1 enrolls in Course 1 (Enrolled)
        await prisma.enrollmentRequest.upsert({
            where: { studentId_courseOfferingId: { studentId: students[0].id, courseOfferingId: courses[0].id } },
            update: { status: 'ENROLLED', enrolledAt: new Date() },
            create: { studentId: students[0].id, courseOfferingId: courses[0].id, status: 'ENROLLED', enrolledAt: new Date() }
        });

        // Student 1 requests Course 2 (Pending Instructor)
        await prisma.enrollmentRequest.upsert({
            where: { studentId_courseOfferingId: { studentId: students[0].id, courseOfferingId: courses[1].id } },
            update: { status: 'PENDING_INSTRUCTOR_APPROVAL' },
            create: { studentId: students[0].id, courseOfferingId: courses[1].id, status: 'PENDING_INSTRUCTOR_APPROVAL' }
        });
        
        console.log(`✅ Enrollment requests created for testing`);
    }

    console.log('Seeding completed. \n\n🔑 DEFAULT PASSWORD FOR ALL USERS: Password@123\nAdmin: ' + adminEmail);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
