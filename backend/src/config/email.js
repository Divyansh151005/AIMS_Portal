import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email allowlist configuration - can be controlled via environment variables
// Set ENFORCE_EMAIL_ALLOWLIST=false to disable allowlist (e.g., in production)
// Set EMAIL_ALLOWLIST=email1@example.com,email2@example.com to customize the list
const ENFORCE_EMAIL_ALLOWLIST = process.env.ENFORCE_EMAIL_ALLOWLIST !== 'false'; // Default: true (enabled)
const EMAIL_ALLOWLIST = process.env.EMAIL_ALLOWLIST
  ? process.env.EMAIL_ALLOWLIST.split(',').map(e => e.trim().toLowerCase())
  : [
    '2023csb1119@iitrpr.ac.in',
    '2023eeb1191@iitrpr.ac.in',
    '2023csb1152@iitrpr.ac.in',
    '2023csb112@iitrpr.ac.in',
    '2023meb1387@iitrpr.ac.in',
  ];

export const sendEmail = async (to, subject, html, text) => {
  try {
    // Check if recipient email is in allowlist (only if enforcement is enabled)
    if (ENFORCE_EMAIL_ALLOWLIST) {
      const recipientEmails = Array.isArray(to) ? to : [to];
      const blockedEmails = recipientEmails.filter(email => !EMAIL_ALLOWLIST.includes(email.toLowerCase()));

      if (blockedEmails.length > 0) {
        console.log(`Email blocked by test allowlist: ${blockedEmails.join(', ')}`);
        console.log(`To disable allowlist, set ENFORCE_EMAIL_ALLOWLIST=false in .env`);
        // Return a mock success response instead of actually sending
        return { messageId: 'blocked-by-allowlist', blocked: blockedEmails };
      }
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"AIMS Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

export const sendOTPEmail = async (email, name, otp) => {
  const subject = 'Your OTP for AIMS Portal Login';
  const html = `
    <h2>Login OTP - AIMS Portal</h2>
    <p>Dear ${name},</p>
    <p>Your One-Time Password (OTP) for logging into AIMS Portal is:</p>
    <h1 style="font-size: 32px; letter-spacing: 8px; color: #2563eb; font-family: monospace;">${otp}</h1>
    <p>This OTP is valid for <strong>10 minutes</strong>.</p>
    <p>If you did not request this OTP, please ignore this email.</p>
    <p>Best regards,<br>AIMS Portal Team</p>
  `;
  const text = `Your OTP for AIMS Portal login is: ${otp}. Valid for 10 minutes.`;

  return sendEmail(email, subject, html, text);
};

export const sendStudentApprovalEmail = async (studentEmail, studentName, approved) => {
  const subject = approved
    ? 'Student Account Approved - AIMS Portal'
    : 'Student Account Rejected - AIMS Portal';

  const html = approved
    ? `
      <h2>Welcome to AIMS Portal!</h2>
      <p>Dear ${studentName},</p>
      <p>Your student account has been approved by the administrator.</p>
      <p>You can now log in to the AIMS Portal using your credentials.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `
    : `
      <h2>Account Status Update</h2>
      <p>Dear ${studentName},</p>
      <p>Your student account registration has been reviewed and unfortunately rejected.</p>
      <p>Please contact the administration for more details.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `;

  return sendEmail(studentEmail, subject, html);
};

export const sendEnrollmentStatusEmail = async (studentEmail, studentName, courseCode, courseTitle, status, role) => {
  let subject, html;

  if (status === 'PENDING_INSTRUCTOR_APPROVAL') {
    subject = `Enrollment Request Submitted - ${courseCode}`;
    html = `
      <h2>Enrollment Request Submitted</h2>
      <p>Dear ${studentName},</p>
      <p>Your enrollment request for <strong>${courseCode} - ${courseTitle}</strong> has been submitted.</p>
      <p>Status: Pending Instructor Approval</p>
      <p>You will be notified once the instructor reviews your request.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `;
  } else if (status === 'PENDING_ADVISOR_APPROVAL') {
    subject = role === 'STUDENT'
      ? `Instructor Approved - Awaiting Advisor Approval - ${courseCode}`
      : `New Enrollment Request - ${courseCode}`;

    html = role === 'STUDENT'
      ? `
        <h2>Instructor Approved Your Request</h2>
        <p>Dear ${studentName},</p>
        <p>Your enrollment request for <strong>${courseCode} - ${courseTitle}</strong> has been approved by the instructor.</p>
        <p>Status: Pending Faculty Advisor Approval</p>
        <p>You will be notified once your advisor reviews the request.</p>
        <p>Best regards,<br>AIMS Portal Team</p>
      `
      : `
        <h2>New Enrollment Request for Your Student</h2>
        <p>A student assigned to you has requested enrollment in <strong>${courseCode} - ${courseTitle}</strong>.</p>
        <p>The instructor has already approved this request.</p>
        <p>Status: Pending Your Approval</p>
        <p>Please review and approve/reject the request in your dashboard.</p>
        <p>Best regards,<br>AIMS Portal Team</p>
      `;
  } else if (status === 'ENROLLED') {
    subject = `Enrollment Confirmed - ${courseCode}`;
    html = `
      <h2>Enrollment Confirmed!</h2>
      <p>Dear ${studentName},</p>
      <p>Your enrollment in <strong>${courseCode} - ${courseTitle}</strong> has been confirmed.</p>
      <p>Status: Enrolled</p>
      <p>Your timetable has been updated. You can view your schedule in the dashboard.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `;
  } else if (status === 'REJECTED') {
    subject = `Enrollment Request Rejected - ${courseCode}`;
    html = `
      <h2>Enrollment Request Rejected</h2>
      <p>Dear ${studentName},</p>
      <p>Your enrollment request for <strong>${courseCode} - ${courseTitle}</strong> has been rejected.</p>
      <p>Please contact your instructor or advisor for more details.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `;
  } else if (status === 'DROPPED') {
    subject = `Course Dropped - ${courseCode}`;
    html = `
      <h2>Course Drop Confirmed</h2>
      <p>Dear ${studentName},</p>
      <p>You have successfully dropped <strong>${courseCode} - ${courseTitle}</strong>.</p>
      <p>Your timetable has been updated.</p>
      <p>Best regards,<br>AIMS Portal Team</p>
    `;
  }

  return sendEmail(studentEmail, subject, html);
};
