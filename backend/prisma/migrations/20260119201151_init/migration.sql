-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_ADMIN_APPROVAL', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('CORE', 'PROGRAM_ELECTIVE', 'OPEN_ELECTIVE', 'SCIENCE_MATH_ELECTIVE', 'HS_ELECTIVE');

-- CreateEnum
CREATE TYPE "Slot" AS ENUM ('PC1', 'PC2', 'PC3', 'PC4', 'PCE1', 'PCE2', 'PCE3', 'HSME', 'HSPE', 'PEOE', 'PCPE', 'PCDE', 'PHSME');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING_INSTRUCTOR_APPROVAL', 'PENDING_ADVISOR_APPROVAL', 'ENROLLED', 'REJECTED', 'DROPPED');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('SPRING_2025', 'FALL_2025');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_ADMIN_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "entryYear" INTEGER NOT NULL,
    "advisorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "courseType" "CourseType" NOT NULL,
    "slot" "Slot" NOT NULL,
    "allowedBranches" TEXT[],
    "allowedYears" INTEGER[],
    "L" INTEGER NOT NULL,
    "P" INTEGER NOT NULL,
    "T" DOUBLE PRECISION NOT NULL,
    "S" DOUBLE PRECISION NOT NULL,
    "C" DOUBLE PRECISION NOT NULL,
    "syllabus" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING_INSTRUCTOR_APPROVAL',
    "instructorApprovedAt" TIMESTAMP(3),
    "advisorApprovedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3),
    "droppedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "grade" TEXT,
    "marks" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "timeSlot" INTEGER NOT NULL,
    "slot" "Slot" NOT NULL,
    "userId" TEXT,
    "courseOfferingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE INDEX "Student_rollNumber_idx" ON "Student"("rollNumber");

-- CreateIndex
CREATE INDEX "Student_branch_entryYear_idx" ON "Student"("branch", "entryYear");

-- CreateIndex
CREATE INDEX "Student_advisorId_idx" ON "Student"("advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_userId_idx" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "Teacher"("department");

-- CreateIndex
CREATE INDEX "CourseOffering_courseCode_semester_idx" ON "CourseOffering"("courseCode", "semester");

-- CreateIndex
CREATE INDEX "CourseOffering_instructorId_idx" ON "CourseOffering"("instructorId");

-- CreateIndex
CREATE INDEX "CourseOffering_slot_semester_isApproved_idx" ON "CourseOffering"("slot", "semester", "isApproved");

-- CreateIndex
CREATE INDEX "CourseOffering_isApproved_idx" ON "CourseOffering"("isApproved");

-- CreateIndex
CREATE INDEX "EnrollmentRequest_studentId_status_idx" ON "EnrollmentRequest"("studentId", "status");

-- CreateIndex
CREATE INDEX "EnrollmentRequest_courseOfferingId_status_idx" ON "EnrollmentRequest"("courseOfferingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentRequest_studentId_courseOfferingId_key" ON "EnrollmentRequest"("studentId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_courseOfferingId_idx" ON "Grade"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_studentId_courseOfferingId_key" ON "Grade"("studentId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "Timetable_userId_idx" ON "Timetable"("userId");

-- CreateIndex
CREATE INDEX "Timetable_slot_day_timeSlot_idx" ON "Timetable"("slot", "day", "timeSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_day_timeSlot_userId_slot_key" ON "Timetable"("day", "timeSlot", "userId", "slot");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
