# Quick Setup Guide - Email Authentication

## ✅ What's Been Fixed

- ✅ OTP emails now sent via Nodemailer (not shown as popups)
- ✅ Course notifications sent via Nodemailer
- ✅ All development mode OTP exposure removed
- ✅ Comprehensive documentation created
- ✅ Single unified email system (Nodemailer only)

## 🚀 Quick Setup (2 Steps)

### Step 1: Configure Nodemailer (for ALL emails)

**For Gmail:**

1. Enable 2FA in Google Account
2. Generate App Password: Google Account → Security → 2-Step Verification → App passwords
3. Add to `backend/.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM="AIMS Portal <noreply@aimsportal.com>"
   ```

### Step 2: Add Your Email to Allowlist (for testing)

Edit `backend/src/config/email.js` (line 14):
```javascript
const EMAIL_ALLOWLIST = [
  '2023csb1119@iitrpr.ac.in',
  'your-email@example.com',  // Add your email here
];

## 🧪 Test It

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

1. Go to `http://localhost:3000/signup`
2. Enter your email
3. Check your inbox for OTP (NOT a popup!)
4. Enter OTP to complete signup

## 📚 Full Documentation

- **Detailed Setup:** See `EMAIL_CONFIGURATION.md`
- **Environment Variables:** See `backend/.env.example`
- **All Changes:** See walkthrough artifact

## ❓ Troubleshooting

**OTP not arriving?**
- Check backend console for `[NO EMAIL CONFIG]` message
- Verify SMTP credentials in `backend/.env`
- For Gmail, use App Password (not regular password)
- Check spam folder
- Restart backend server after adding credentials

**Course emails not arriving?**
- Check if your email is in the allowlist
- Verify SMTP credentials in `.env`
- Check spam folder

## 📋 What You Need

### Required for ALL Emails (Nodemailer)
- ✅ `EMAIL_HOST` in `backend/.env`
- ✅ `EMAIL_PORT` in `backend/.env`
- ✅ `EMAIL_USER` in `backend/.env`
- ✅ `EMAIL_PASS` in `backend/.env`
- ✅ `EMAIL_FROM` in `backend/.env`
- ✅ Your email in allowlist (for testing)

That's it! Once you add these credentials, all emails (OTP + course notifications) will work automatically. 🎉
