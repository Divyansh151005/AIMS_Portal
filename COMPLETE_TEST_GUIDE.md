# AIMS Portal - Complete End-to-End Testing Guide

## 🔧 Prerequisites Setup

### 1. Database Setup
```bash
cd backend
npx prisma db push --accept-data-loss
npm run db:generate
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```
**Server should be running on:** `http://localhost:5000`

### 3. Start Frontend (for frontend tests)
```bash
cd frontend
npm install
npm run dev
```
**Frontend should be running on:** `http://localhost:3000`

---

## 📋 Backend End-to-End Testing

### Run Backend Tests
```bash
cd backend
npm run test:e2e
```

### What Gets Tested:

#### ✅ Authentication Tests (TC-1 to TC-7)
- Student signup with valid email format
- Invalid email format rejection
- Weak password validation
- Pending user login blocking
- Wrong password rejection
- Approved user login success
- JWT token validation

#### ✅ Admin Workflow Tests (TC-100+)
- Create teacher accounts
- Approve/reject students
- Assign advisors to students
- Approve/reject course offerings

#### ✅ Course Offering Tests (TC-200+)
- Create course offerings
- Credit calculation (T, S, C formulas)
- Invalid slot validation
- Course visibility (before/after approval)

#### ✅ Enrollment Workflow Tests (TC-300+)
- Student enrollment requests
- Slot conflict detection
- Instructor approval workflow
- Advisor approval workflow
- Eligibility checks (branch/year restrictions)

#### ✅ Course Drop Tests (TC-400+)
- Drop enrolled courses
- Status updates

#### ✅ Grades Tests (TC-500+)
- Assign grades (teacher)
- Unpublished grade visibility (students can't see)
- Publish grades
- Published grade visibility (students can see)

#### ✅ Security Tests (TC-600+)
- Password hashing verification (bcrypt)
- JWT tampering detection
- RBAC enforcement (role-based access control)

#### ✅ Database Consistency Tests (TC-700+)
- Orphan record detection
- Unique constraint validation

#### ✅ Error & Edge Cases (TC-800+)
- Double approval handling
- Missing required fields validation

---

## 🎨 Frontend Testing

### Manual Frontend Test Checklist

#### Authentication Pages
- [ ] **Login Page** (`/login`)
  - Valid credentials → Redirect to correct dashboard
  - Invalid credentials → Error message shown
  - Pending user → Blocked with appropriate message

- [ ] **Signup Page** (`/signup`)
  - Student signup → Success message, pending status
  - Invalid email format → Validation error
  - Weak password → Validation error
  - Duplicate email → Error message

#### Student Dashboard (`/student/dashboard`)
- [ ] Dashboard loads with statistics
- [ ] Enrolled courses count correct
- [ ] Pending approvals displayed
- [ ] Total credits calculated correctly
- [ ] Navigation links work

#### Student Courses (`/student/courses`)
- [ ] Approved courses listed
- [ ] Enrollment button works
- [ ] Slot conflict error displayed
- [ ] Eligibility restrictions enforced

#### Student Enrollments
- [ ] Enrollment status progression tracked
- [ ] Drop course functionality works
- [ ] Email notifications (check allowlist)

#### Teacher Dashboard (`/teacher/dashboard`)
- [ ] Course offerings displayed
- [ ] Pending enrollments shown
- [ ] Approval/rejection buttons work

#### Teacher Offer Course (`/teacher/offer-course`)
- [ ] Form validation works
- [ ] Credit calculation (T, S, C) correct
- [ ] Course created successfully

#### Admin Dashboard (`/admin/dashboard`)
- [ ] Statistics displayed correctly
- [ ] Pending students count accurate
- [ ] Pending courses count accurate

#### Admin Students (`/admin/students`)
- [ ] Pending students listed
- [ ] Approve/reject buttons work
- [ ] Advisor assignment works

#### Admin Courses (`/admin/courses`)
- [ ] Pending courses listed
- [ ] Approve/reject functionality works

#### Route Guard Testing
- [ ] Unauthenticated → Redirect to `/login`
- [ ] Student accessing admin routes → Redirect to student dashboard
- [ ] Teacher accessing student routes → Redirect to teacher dashboard
- [ ] Admin can access all routes

---

## 🧪 Automated Frontend Testing (To Be Implemented)

### Recommended Testing Framework: Playwright or Cypress

```javascript
// Example Playwright test structure
describe('Student Enrollment Flow', () => {
  it('should enroll in course successfully', async () => {
    // 1. Login as student
    // 2. Navigate to courses
    // 3. Click enroll
    // 4. Verify pending status
    // 5. Login as instructor
    // 6. Approve enrollment
    // 7. Login as advisor
    // 8. Approve enrollment
    // 9. Verify enrolled status
  });
});
```

---

## 📊 Test Report Analysis

After running backend tests, check:
```
backend/tests/TEST_REPORT.md
```

The report includes:
- ✅ Test case table with pass/fail status
- 🐞 Bug list with severity and repro steps
- 📊 Coverage summary
- 🚦 Final verdict (Production-ready: YES/NO)

---

## 🚀 Quick Start Commands

### Full Test Suite (Backend)
```bash
# Terminal 1: Start server
cd backend && npm run dev

# Terminal 2: Run tests (after server starts)
cd backend && npm run test:e2e

# View results
cat backend/tests/TEST_REPORT.md
```

### Frontend Manual Testing
```bash
# Terminal 1: Backend server
cd backend && npm run dev

# Terminal 2: Frontend server
cd frontend && npm run dev

# Then test in browser: http://localhost:3000
```

---

## 🐛 Common Issues & Solutions

### Issue: Database tables don't exist
**Solution:**
```bash
cd backend
npx prisma db push --accept-data-loss
```

### Issue: Server not running
**Solution:**
```bash
cd backend
npm run dev
# Check: curl http://localhost:5000/api/health
```

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Issue: Email allowlist blocking
**Expected behavior:** Only these emails receive emails:
- 2023csb1119@iitrpr.ac.in
- 2023eeb1191@iitrpr.ac.in
- 2023csb1152@iitrpr.ac.in
- 2023meb1387@iitrpr.ac.in

---

## 📝 Test Results Checklist

After running all tests, verify:

### Backend ✅
- [ ] All API endpoints return correct status codes
- [ ] Password hashing verified
- [ ] JWT authentication working
- [ ] RBAC enforced
- [ ] Database constraints maintained
- [ ] Email allowlist functioning

### Frontend ✅
- [ ] All pages load correctly
- [ ] Authentication flow works
- [ ] Route guards enforced
- [ ] API calls successful
- [ ] Error handling displays properly
- [ ] Navigation works across all roles

---

## 🎯 Production Readiness Criteria

**System is production-ready when:**
1. ✅ Backend test pass rate ≥ 90%
2. ✅ No CRITICAL bugs
3. ✅ All security tests passing
4. ✅ Frontend manually tested and working
5. ✅ Database constraints validated
6. ✅ Email notifications working (allowlist enforced)

---

**Last Updated:** Test suite created and ready for execution
