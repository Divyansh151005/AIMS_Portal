import { createClerkClient } from '@clerk/backend';
import nodemailer from 'nodemailer';

// Initialize Clerk with secret key (for future authentication features)
const clerk = process.env.CLERK_SECRET_KEY
    ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    : null;

export default clerk;

// Configure Nodemailer transporter for OTP emails
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// OTP storage for verification
const otpStore = new Map();

/**
 * Generate OTP HTML email template
 */
const generateOTPEmailHTML = (otp, type = 'signup') => {
    console.log(otp);
    const title = type === 'signup' ? 'Verify Your Signup' : 'Login Verification';
    const message = type === 'signup'
        ? 'Thank you for signing up for AIMS Portal. Please use the following code to verify your email address.'
        : 'Please use the following code to log in to your AIMS Portal account.';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 24px;">${title}</h1>
                                    <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                        ${message}
                                    </p>
                                    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 0 0 30px 0;">
                                        <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Your verification code:</p>
                                        <p style="margin: 0; font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            ${otp}
                                        </p>
                                    </div>
                                    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0 0 10px 0;">
                                        This code will expire in 10 minutes.
                                    </p>
                                    <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                                        If you didn't request this code, please ignore this email.
                                    </p>
                                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                                    <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0;">
                                        AIMS Portal - Academic Information Management System
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;
};

/**
 * Send OTP for signup verification
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendSignupOTP = async (email) => {
    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiration (10 minutes)
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            type: 'signup'
        });

        // Check if email configuration is available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[NO EMAIL CONFIG] Signup OTP for ${email}: ${otp}`);
            console.log('⚠️  EMAIL_USER and EMAIL_PASS not configured. Add them to .env file to send emails.');
            return { success: true, message: 'OTP generated (Email not configured)' };
        }

        // Send email via Nodemailer
        const htmlBody = generateOTPEmailHTML(otp, 'signup');

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"AIMS Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your AIMS Portal Signup',
            html: htmlBody,
            text: `Your AIMS Portal verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
        });

        console.log(`✅ Signup OTP email sent to ${email}`);
        return { success: true, message: 'OTP sent via email' };
    } catch (error) {
        console.error('Error sending signup OTP:', error);
        const storedData = otpStore.get(email);
        if (storedData) {
            console.log(`⚠️  Fallback: OTP for ${email} is stored but email not sent. OTP: ${storedData.otp}`);
        }
        return { success: true, message: 'OTP generated (email sending failed, check logs)' };
    }
};

/**
 * Send OTP for login verification
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendLoginOTP = async (email) => {
    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with expiration (10 minutes)
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            type: 'login'
        });

        // Check if email configuration is available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log(`[NO EMAIL CONFIG] Login OTP for ${email}: ${otp}`);
            console.log('⚠️  EMAIL_USER and EMAIL_PASS not configured. Add them to .env file to send emails.');
            return { success: true, message: 'OTP generated (Email not configured)' };
        }

        // Send email via Nodemailer
        const htmlBody = generateOTPEmailHTML(otp, 'login');

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"AIMS Portal" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your AIMS Portal Login Code',
            html: htmlBody,
            text: `Your AIMS Portal login code is: ${otp}\n\nThis code will expire in 10 minutes.`,
        });

        console.log(`✅ Login OTP email sent to ${email}`);
        return { success: true, message: 'OTP sent via email' };
    } catch (error) {
        console.error('Error sending login OTP:', error);
        const storedData = otpStore.get(email);
        if (storedData) {
            console.log(`⚠️  Fallback: OTP for ${email} is stored but email not sent. OTP: ${storedData.otp}`);
        }
        return { success: true, message: 'OTP generated (email sending failed, check logs)' };
    }
};

/**
 * Verify OTP code
 * @param {string} email - User's email address
 * @param {string} code - OTP code to verify
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const verifyOTPCode = async (email, code) => {
    try {
        const storedData = otpStore.get(email);

        if (!storedData) {
            throw new Error('No OTP found for this email. Please request a new one.');
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email);
            throw new Error('OTP has expired. Please request a new one.');
        }

        if (storedData.otp !== code) {
            throw new Error('Invalid OTP code.');
        }

        // OTP is valid, remove it
        otpStore.delete(email);

        console.log(`✅ OTP verified successfully for ${email}`);
        return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};
