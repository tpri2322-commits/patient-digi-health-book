import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../constants/api';

export const authService = {
  // Register
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otpCode, purpose = 'REGISTRATION') => {
    const response = await api.post(API_ENDPOINTS.VERIFY_OTP, {
      email,
      otp_code: otpCode,
      purpose,
    });
    
    if (response.data.access) {
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    
    if (response.data.access) {
      await AsyncStorage.setItem('access_token', response.data.access);
      await AsyncStorage.setItem('refresh_token', response.data.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // Get Profile
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.PROFILE);
    return response.data;
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const response = await api.put(API_ENDPOINTS.PROFILE, profileData);
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  // Change Password
  changePassword: async (oldPassword, newPassword, newPasswordConfirm) => {
    const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  // Request Password Reset
  requestPasswordReset: async (email) => {
    const response = await api.post(API_ENDPOINTS.PASSWORD_RESET_REQUEST, {
      email,
    });
    return response.data;
  },

  // Reset Password
  resetPassword: async (email, otpCode, newPassword, newPasswordConfirm) => {
    const response = await api.post(API_ENDPOINTS.PASSWORD_RESET, {
      email,
      otp_code: otpCode,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email, purpose = 'REGISTRATION') => {
    const response = await api.post(API_ENDPOINTS.RESEND_OTP, {
      email,
      purpose,
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post(API_ENDPOINTS.LOGOUT, {
          refresh_token: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    }
  },

  // Check if user is logged in
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  },

  // Get current user
  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

