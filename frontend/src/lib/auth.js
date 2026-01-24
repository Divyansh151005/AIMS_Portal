import Cookies from 'js-cookie';
import { authAPI } from './api';

export const setToken = (token) => {
  Cookies.set('token', token, { expires: 7 }); // 7 days
};

export const getToken = () => {
  return Cookies.get('token');
};

export const removeToken = () => {
  Cookies.remove('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Initiate signup - send user details and receive OTP
 */
export const initiateSignup = async (data) => {
  try {
    const response = await authAPI.initiateSignup(data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Signup initiation failed' };
  }
};

/**
 * Verify signup OTP and complete registration
 */
export const verifySignupOTP = async (email, otp) => {
  try {
    const response = await authAPI.verifySignupOTP({ email, otp });
    const { token, user } = response.data;
    setToken(token);
    return { user, token };
  } catch (error) {
    throw error.response?.data || { error: 'OTP verification failed' };
  }
};

export const logout = () => {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await authAPI.getMe();
    return response.data;
  } catch (error) {
    removeToken();
    throw error;
  }
};

/**
 * Send OTP for login
 */
export const sendOTP = async (email) => {
  try {
    const response = await authAPI.sendOTP({ email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to send OTP' };
  }
};

/**
 * Verify OTP and login
 */
export const verifyOTP = async (email, otp) => {
  try {
    const response = await authAPI.verifyOTP({ email, otp });
    const { token, user } = response.data;
    setToken(token);
    return { user, token };
  } catch (error) {
    throw error.response?.data || { error: 'OTP verification failed' };
  }
};
