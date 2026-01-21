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

export const login = async (email, password) => {
  console.log(email,password)
  try {
    const response = await authAPI.login({ email, password });
    const { token, user } = response.data;
    setToken(token);
    return { user, token };
  } catch (error) {
    throw error.response?.data || { error: 'Login failed' };
  }
};

export const signup = async (data) => {
  try {
    const response = await authAPI.signup(data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Signup failed' };
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
