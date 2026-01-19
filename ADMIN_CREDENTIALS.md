# Admin Login Credentials

## 🔐 Admin Account

**Email:** `admin@aims.test`  
**Password:** `Admin@123`

---

## 📋 Test User Credentials

These users are created automatically by the test suite:

### Admin
- **Email:** admin@aims.test
- **Password:** Admin@123
- **Status:** ACTIVE (can login immediately)

### Teachers
- **Email:** teacher1@aims.test
- **Password:** Teacher@123
- **Department:** CSE
- **Status:** ACTIVE

- **Email:** teacher2@aims.test
- **Password:** Teacher@123
- **Department:** EE
- **Status:** ACTIVE

### Students
- **Email:** 2023csb0001@aims.test
- **Password:** Student@123
- **Branch:** CSB
- **Entry Year:** 2023
- **Status:** ACTIVE (after admin approval)

- **Email:** 2024meb0002@aims.test
- **Password:** Student@123
- **Branch:** MEB
- **Entry Year:** 2024
- **Status:** PENDING_ADMIN_APPROVAL (if not approved yet)

---

## 🚨 Note

The admin user is automatically created by the test suite. If you need to create it manually:

```bash
# Using Prisma Studio or direct database access
# Or run the test suite once which creates it
```

---

## ✅ Quick Login

1. Go to: `http://localhost:3000/login`
2. Enter:
   - Email: `admin@aims.test`
   - Password: `Admin@123`
3. Click "Login"
4. You'll be redirected to `/admin/dashboard`
