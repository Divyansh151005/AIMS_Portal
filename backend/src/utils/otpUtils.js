import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP before storing in database
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
export const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
};

/**
 * Verify OTP against hashed OTP
 * @param {string} otp - Plain text OTP
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} True if OTP matches
 */
export const verifyOTP = async (otp, hashedOTP) => {
    return bcrypt.compare(otp, hashedOTP);
};

/**
 * Check if OTP has expired (10 minutes validity)
 * @param {Date} otpExpiry - OTP expiry timestamp
 * @returns {boolean} True if OTP has expired
 */
export const isOTPExpired = (otpExpiry) => {
    if (!otpExpiry) return true;
    return new Date() > new Date(otpExpiry);
};

/**
 * Get OTP expiry time (10 minutes from now)
 * @returns {Date} OTP expiry timestamp
 */
export const getOTPExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};
