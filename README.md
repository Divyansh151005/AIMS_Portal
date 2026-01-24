# AIMS Portal - Academic Information Management System

A production-ready, full-stack academic management system for universities with role-based access control, multi-step approval workflows, and comprehensive course management.

## Features

### 🔐 Authentication & Authorization
- **Three roles**: Student, Teacher, Admin
- **Secure password hashing** using bcrypt
- **JWT-based authentication**
- **Role-based access control** with route guards

### 👨‍🎓 Student Features
- Sign up with automatic email parsing (extracts roll number, branch, entry year)
- Pending approval workflow (Admin → Faculty Advisor)
- Course registration with slot conflict detection
- Multi-step enrollment approval (Instructor → Advisor)
- View enrolled courses, grades, and timetable
- Course dropping functionality

### 👨‍🏫 Teacher Features
- Create course offerings with automatic credit calculation
- Approve/reject student enrollment requests
- Assign and publish grades
- View student list per course
- Manage timetable for offered courses
- Act as Faculty Advisor for assigned students

### 👨‍💼 Admin Features
- Approve/reject student signups
- Assign Faculty Advisors to students
- Approve/reject course offerings
- Add/remove teachers
- View system statistics
- Full system control

### 📧 Email Notifications
- Student signup approval/rejection
- Enrollment request status updates
- Enrollment confirmation
- Course drop confirmations

### 📊 Course Management
- Course offering with detailed metadata
- Automatic credit calculation (T, S, C from L and P)
- Slot conflict detection
- Branch and entry year eligibility
- Syllabus upload support

### 📅 Timetable Management
- Dynamic timetable updates based on enrollments
- Slot-based scheduling
- Real-time updates for students and teachers
- Course codes displayed in timetable

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Email**: NodeMailer
- **Validation**: express-validator

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Forms**: react-hook-form
- **Notifications**: react-hot-toast

## Project Structure

```
AIMS_Portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── email.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── courseController.js
│   │   │   ├── enrollmentController.js
│   │   │   ├── gradeController.js
│   │   │   ├── studentController.js
│   │   │   ├── teacherController.js
│   │   │   └── timetableController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── course.js
│   │   │   ├── enrollment.js
│   │   │   ├── grade.js
│   │   │   ├── student.js
│   │   │   ├── teacher.js
│   │   │   └── timetable.js
│   │   ├── utils/
│   │   │   ├── auth.js
│   │   │   ├── creditCalculator.js
│   │   │   └── emailParser.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── (Next.js structure)
│   └── package.json
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Email account for NodeMailer (Gmail recommended)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in `backend/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/aims_portal"
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=AIMS Portal <noreply@aimsportal.com>
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Seed database (optional)**
   ```bash
   npm run db:seed
   ```

5. **Start backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   Create a `.env.local` file in `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start frontend server**
   ```bash
   npm run dev
   ```

### Initialize Timetable

After setting up the database, initialize the timetable structure:

```bash
# Make a POST request to:
POST http://localhost:5000/api/timetable/initialize
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Student/Teacher signup
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Student
- `GET /api/students/dashboard` - Student dashboard
- `GET /api/students/courses` - Enrolled courses
- `GET /api/students/approvals` - Pending approvals
- `GET /api/students/timetable` - Student timetable
- `GET /api/students/grades` - Student grades

### Teacher
- `GET /api/teachers/dashboard` - Teacher dashboard
- `GET /api/teachers/enrollments` - Enrollment requests
- `GET /api/teachers/courses` - My courses
- `GET /api/teachers/timetable` - Teacher timetable

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/students/pending` - Pending student approvals
- `POST /api/admin/students/:id/approve` - Approve student
- `POST /api/admin/students/:id/reject` - Reject student
- `POST /api/admin/students/:id/advisor` - Assign advisor
- `GET /api/admin/teachers` - List teachers
- `POST /api/admin/teachers` - Create teacher
- `GET /api/admin/courses/pending` - Pending course approvals
- `POST /api/admin/courses/:id/approve` - Approve course

### Courses
- `GET /api/courses/approved` - Get approved courses
- `POST /api/courses/offerings` - Create course offering (Teacher)
- `GET /api/courses/offerings/my` - My course offerings (Teacher)
- `GET /api/courses/:id` - Get course details

### Enrollment
- `POST /api/enrollments/enroll` - Enroll in course (Student)
- `POST /api/enrollments/drop/:id` - Drop course (Student)
- `POST /api/enrollments/approve/instructor/:id` - Approve as instructor
- `POST /api/enrollments/approve/advisor/:id` - Approve as advisor
- `POST /api/enrollments/reject/:id` - Reject enrollment

### Grades
- `POST /api/grades` - Assign grade (Teacher)
- `PUT /api/grades/:id` - Update grade (Teacher)
- `POST /api/grades/:id/publish` - Publish grade (Teacher)
- `GET /api/grades/course/:courseOfferingId` - Get grades by course
- `GET /api/grades/student` - Get student grades

## Database Schema

Key entities:
- **User** - Base user table with role and status
- **Student** - Student-specific data (roll number, branch, entry year, advisor)
- **Teacher** - Teacher-specific data (department)
- **CourseOffering** - Course offerings with metadata
- **EnrollmentRequest** - Enrollment requests with approval status
- **Grade** - Grades assigned to students
- **Timetable** - Timetable entries with slots

## Security Features

- Password hashing with bcrypt (salt rounds: 10)
- JWT token-based authentication
- Role-based route guards
- Input validation with express-validator
- SQL injection protection via Prisma ORM
- CORS configuration

## Workflow Examples

### Student Enrollment Flow
1. Student requests enrollment in a course
2. System checks: eligibility, slot conflicts
3. Status: `PENDING_INSTRUCTOR_APPROVAL`
4. Instructor approves → Status: `PENDING_ADVISOR_APPROVAL`
5. Faculty Advisor approves → Status: `ENROLLED`
6. Timetable updates automatically
7. Email notifications sent at each step

### Course Offering Flow
1. Teacher creates course offering
2. System auto-calculates credits (T, S, C)
3. Status: `isApproved = false`
4. Admin reviews and approves
5. Course becomes visible to students
6. Students can now enroll

## Email Configuration

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_PASS`

## Contributing

This is a production-ready system built following university workflow patterns. Ensure all security best practices are followed when extending.

## License

ISC
