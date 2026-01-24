# Email Configuration Guide - AIMS Portal

## Overview

AIMS Portal uses a **dual email system**:
1. **Clerk** - Handles OTP emails for authentication (signup/login)
2. **Nodemailer** - Handles transactional emails (enrollment, course updates, notifications)

## Why Two Email Systems?

- **Clerk**: Provides reliable, scalable OTP delivery with built-in rate limiting and security features
- **Nodemailer**: Gives you full control over transactional email templates and delivery for course-related notifications

## Setup Instructions

### 1. Clerk Configuration (OTP Emails)

#### Step 1: Create a Clerk Account
1. Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Sign up for a free account
3. Create a new application

#### Step 2: Get API Keys
1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

#### Step 3: Configure Backend
Add to `backend/.env`:
```env
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
```

#### Step 4: Configure Frontend
Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### 2. Nodemailer Configuration (Course Notifications)

#### For Gmail Users

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "AIMS Portal"
   - Copy the 16-character password

3. **Configure Backend**
   Add to `backend/.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM="AIMS Portal <noreply@aimsportal.com>"
   ```

#### For Other Email Providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

**Custom SMTP:**
```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
```

## Email Allowlist (Testing)

During development, emails are restricted to an allowlist to prevent accidental spam.

**Location:** `backend/src/config/email.js` (line 14-20)

```javascript
const EMAIL_ALLOWLIST = [
  '2023csb1119@iitrpr.ac.in',
  '2023eeb1191@iitrpr.ac.in',
  '2023csb1152@iitrpr.ac.in',
  '2023csb1147@iitrpr.ac.in',
  '2023meb1387@iitrpr.ac.in',
];
```

**To add your email for testing:**
1. Open `backend/src/config/email.js`
2. Add your email to the `EMAIL_ALLOWLIST` array
3. Restart the backend server

**To disable allowlist (production):**
Remove or comment out the allowlist check in the `sendEmail` function.

## Testing Email Delivery

### Test OTP Emails (Clerk)

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Go to `http://localhost:3000/signup`
4. Enter your email and submit
5. Check your inbox for OTP email

**Expected behavior:**
- ✅ Email arrives within 30 seconds
- ✅ Email contains 6-digit OTP code
- ✅ Email is professionally formatted
- ❌ NO popup showing OTP in browser

### Test Course Notification Emails (Nodemailer)

1. Ensure your email is in the allowlist
2. Complete signup and login
3. Enroll in a course
4. Check your inbox for enrollment notification

**Expected behavior:**
- ✅ Email arrives for each status change
- ✅ Emails are properly formatted
- ✅ Subject line is descriptive

## Troubleshooting

### OTP Emails Not Arriving

**Check 1: Clerk Configuration**
```bash
# In backend directory
cd backend
grep CLERK_SECRET_KEY .env
```
- Should show your Clerk secret key
- If empty, add it to `.env` file

**Check 2: Backend Logs**
Look for these messages:
- ✅ `✅ Signup OTP email sent to [email] via Clerk`
- ⚠️ `[NO CLERK] Signup OTP for [email]: [code]` - Clerk not configured
- ❌ `Error sending signup OTP via Clerk:` - Check API key

**Check 3: Spam Folder**
- Check your spam/junk folder
- Mark as "Not Spam" if found there

### Course Notification Emails Not Arriving

**Check 1: Email Allowlist**
```bash
# Verify your email is in the allowlist
cd backend
grep -A 10 "EMAIL_ALLOWLIST" src/config/email.js
```

**Check 2: SMTP Configuration**
```bash
# Check SMTP settings
grep EMAIL_ .env
```

**Check 3: Backend Logs**
Look for:
- ✅ `Email sent: [messageId]`
- ⚠️ `Email blocked by test allowlist: [email]`
- ❌ `Email error:` - Check SMTP credentials

**Check 4: Gmail App Password**
- Ensure you're using an App Password, not your regular password
- App Password should be 16 characters without spaces

### Common Errors

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**
- Solution: Generate a new App Password in Gmail settings

**Error: "ECONNREFUSED"**
- Solution: Check EMAIL_HOST and EMAIL_PORT are correct

**Error: "Email blocked by test allowlist"**
- Solution: Add your email to the allowlist in `email.js`

## Production Deployment

Before deploying to production:

1. **Remove Email Allowlist**
   - Comment out or remove the allowlist check in `backend/src/config/email.js`

2. **Use Production Clerk Keys**
   - Replace `sk_test_` with `sk_live_` keys
   - Replace `pk_test_` with `pk_live_` keys

3. **Secure Environment Variables**
   - Never commit `.env` files to git
   - Use environment variable management (e.g., Vercel, Heroku, AWS Secrets Manager)

4. **Configure Email Domain**
   - Update `EMAIL_FROM` to use your actual domain
   - Set up SPF, DKIM, and DMARC records for better deliverability

5. **Monitor Email Delivery**
   - Set up logging for failed email deliveries
   - Monitor Clerk dashboard for OTP delivery metrics

## Email Templates

### OTP Email (Clerk)
- **Subject:** "Verify Your AIMS Portal Signup" or "Your AIMS Portal Login Code"
- **Content:** Professional HTML template with 6-digit code
- **Expiration:** 10 minutes

### Course Notification Emails (Nodemailer)
- **Enrollment Request Submitted**
- **Instructor Approved**
- **Enrollment Confirmed**
- **Enrollment Rejected**
- **Course Dropped**

All templates are located in `backend/src/config/email.js`.

## Support

If you continue to experience issues:
1. Check the backend console logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure your email provider allows SMTP access
4. Check Clerk dashboard for API usage and errors
