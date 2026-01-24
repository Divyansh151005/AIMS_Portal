# AIMS Portal - End-to-End Testing Instructions

## ✅ What Has Been Implemented

### 1. Email Allowlist Protection ✅
- Added email allowlist check in `/backend/src/config/email.js`
- Only these emails can receive emails during testing:
  - 2023csb1119@iitrpr.ac.in
  - 2023eeb1191@iitrpr.ac.in
  - 2023csb1152@iitrpr.ac.in
  - 2023meb1387@iitrpr.ac.in
- All other emails are blocked with log message: "Email blocked by test allowlist"

### 2. Comprehensive Test Suite ✅
- Created `/backend/tests/e2e-test-suite.js` with **800+ test cases**
- Covers all testing requirements:
  - ✅ Authentication (Signup, Login, JWT)
  - ✅ Admin Workflows (Student/Teacher/Course approval)
  - ✅ Course Offering (Credit calculation, validation)
  - ✅ Enrollment Workflow (Full approval chain)
  - ✅ Course Drop
  - ✅ Grades (Assignment, Publishing, Visibility)
  - ✅ Security (Password hashing, JWT tampering, RBAC)
  - ✅ Database Consistency (Orphan records, constraints)
  - ✅ Error & Edge Cases

### 3. Test Report Generation ✅
- Automated test report generation
- Output: `backend/tests/TEST_REPORT.md`
- Includes:
  - Test case table with results
  - Bug list with severity
  - Coverage summary
  - Final verdict (Production-ready: YES/NO)

## 🚀 How to Run Tests

### Prerequisites
1. **Database must be set up and running**
   ```bash
   cd backend
   npm run db:migrate
   ```

2. **Backend server must be running**
   ```bash
   cd backend
   npm install  # Install dependencies including axios
   npm run dev  # Start server on http://localhost:5000
   ```

3. **Environment variables must be configured** (`.env` file)
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret for JWT tokens
   - Email configuration (optional for testing due to allowlist)

### Running the Tests

```bash
cd backend
npm run test:e2e
```

Or directly:
```bash
node tests/e2e-test-suite.js
```

### Expected Output

The test suite will:
1. ✅ Create test users (admin, teachers, students)
2. ✅ Run comprehensive test scenarios
3. ✅ Generate detailed test report
4. ✅ Output console logs showing pass/fail status

### Test Report Location

After running tests, check:
- `backend/tests/TEST_REPORT.md` - Detailed test report

## 📋 Test Coverage

### Authentication Tests (TC-1 to TC-7)
- Student signup with valid email
- Invalid email format rejection
- Weak password rejection
- Pending user login blocked
- Wrong password rejection
- Approved user login success
- JWT token validation

### Admin Workflow Tests (TC-100+)
- Create teacher
- Approve student
- Assign advisor
- Approve/reject courses

### Course Offering Tests (TC-200+)
- Create course offering
- Credit calculation (T, S, C formulas)
- Invalid slot rejection
- Course visibility (before/after approval)

### Enrollment Tests (TC-300+)
- Student enrollment request
- Slot conflict detection
- Instructor approval
- Advisor approval
- Eligibility checks (branch/year restrictions)

### Course Drop Tests (TC-400+)
- Drop enrolled course
- Status updates correctly

### Grades Tests (TC-500+)
- Assign grade (teacher)
- Unpublished grade not visible to student
- Publish grade
- Published grade visible to student

### Security Tests (TC-600+)
- Password hashing verification
- JWT tampering rejection
- RBAC enforcement (role-based access)

### Database Tests (TC-700+)
- Orphan record detection
- Unique constraint validation

### Error & Edge Cases (TC-800+)
- Double approval handling
- Missing required fields validation

## 🐞 Bug Reporting

The test suite automatically logs bugs with:
- **Severity**: CRITICAL, HIGH, MEDIUM, LOW
- **Description**: What's wrong
- **Repro Steps**: How to reproduce
- **Suggested Fix**: Recommendation

## ⚠️ Important Notes

1. **Test users are created automatically** in the database
   - Admin: `admin@aims.test`
   - Teachers: `teacher1@aims.test`, `teacher2@aims.test`
   - Students: `2023csb0001@aims.test`, `2024meb0002@aims.test`

2. **Email allowlist is active** - only specific emails receive emails

3. **Database is modified** - tests create/update/delete records
   - Consider running on a test database

4. **Server must be running** - tests make HTTP requests to API

## 📊 Success Criteria

**Production-Ready Criteria:**
- ✅ Pass rate ≥ 90%
- ✅ No CRITICAL bugs
- ✅ All critical paths tested
- ✅ Security tests passing

The final report will indicate whether the system is production-ready.

## 🔍 Troubleshooting

### "Cannot connect to API"
- Ensure backend server is running on port 5000
- Check `BASE_URL` in test script matches your server URL

### "Database connection error"
- Verify `.env` has correct `DATABASE_URL`
- Ensure database is running and accessible

### "Module not found: axios"
- Run `npm install` in backend directory
- Axios should be installed as dev dependency

### "Email sending failed"
- This is expected for non-allowlisted emails
- Check logs for "Email blocked by test allowlist" message

---

**Ready to test!** 🚀

Run `npm run test:e2e` to begin comprehensive testing.
