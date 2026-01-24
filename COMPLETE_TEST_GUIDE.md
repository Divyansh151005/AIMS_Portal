# Complete Testing Guide

The database has been seeded with data to help you verify the application's functionality. Use the credentials and steps below to test the different roles and workflows.

## 🔑 Login Credentials

**Universal Password:** `Password@123`

| Role | Email | Name | Dashboard Features to Check |
| :--- | :--- | :--- | :--- |
| **Admin** | `2023csb1147@iitrpr.ac.in` | System Administrator | User Management, System Stats |
| **Teacher** | `teacher.cse@iitrpr.ac.in` | Dr. Alan Turing | Course Offerings, Enrollment Approvals |
| **Student** | `student.cse1@iitrpr.ac.in` | Alice Smith | Course Registration, Enrollment Status |

---

## 🧪 Test Scenarios

### 1. Student Workflow (Registration)
1.  **Login** as **Student** (`student.cse1@iitrpr.ac.in`).
2.  Navigate to **Course Registration**.
3.  You should see:
    -   `CS101` and `CS201` as **Core** courses.
    -   `MA101` as a **Science/Math Elective**.
4.  **Verify Status**:
    -   `CS101` should show as **ENROLLED**.
    -   `CS201` should show as **PENDING_INSTRUCTOR**.
5.  **Action**: Try to enroll in `MA101`. The status should change to `PENDING_INSTRUCTOR_APPROVAL`.

### 2. Teacher Workflow (Approvals)
1.  **Login** as **Teacher** (`teacher.cse@iitrpr.ac.in`).
2.  Navigate to **My Courses**.
3.  Select **CS201 (Data Structures)**.
4.  Go to the **Enrollment Requests** tab.
5.  **Action**: You should see a request from **Alice Smith**.
    -   Click **Approve** or **Reject**.
    -   Verify the count of enrolled students updates.

### 3. Admin Workflow (Overview)
1.  **Login** as **Admin** (`2023csb1147@iitrpr.ac.in`).
2.  Navigate to **User Management**.
3.  **Verify**: You should see a list of all seeded users (Teachers and Students).
4.  **Action**: You can try deactivating a user and verifying they can no longer log in.

## 🐞 Troubleshooting
-   If you see "Invalid Credentials", ensure you are copying the email exactly and using `Password@123`.
-   If the dashboard is empty, ensure the backend is running (`npm run dev` in `backend` folder) and you are connected to the correct database.
