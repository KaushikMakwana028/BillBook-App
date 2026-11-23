/**
 * BillBook Authentication Service
 * API calls for Login, Registration, OTP, Profile & Logout
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const authService = {
  /**
   * Send OTP for mobile login
   * @param {string} mobile - 10-digit mobile number
   */
  sendLoginOtp: async (mobile) => {
    return await apiClient.post(ENDPOINTS.SEND_OTP, { mobile });
  },

  /**
   * Resend OTP for mobile login
   * @param {string} mobile - 10-digit mobile number
   */
  resendLoginOtp: async (mobile) => {
    return await apiClient.post(ENDPOINTS.RESEND_OTP, { mobile });
  },

  /**
   * Verify OTP to complete login
   * @param {string} mobile - 10-digit mobile number
   * @param {string} otp - 6-digit OTP code
   */
  verifyLoginOtp: async (mobile, otp) => {
    return await apiClient.post(ENDPOINTS.VERIFY_OTP, { mobile, otp });
  },

  /**
   * Step 1: Initiate Registration (sends OTP)
   * @param {string} email
   * @param {string} mobile
   */
  registerUser: async (email, mobile) => {
    return await apiClient.post(ENDPOINTS.REGISTER, { email, mobile });
  },

  /**
   * Step 2: Verify Registration OTP & create account
   * @param {Object} payload - { mobile, otp, full_name, business_name, email }
   */
  verifyRegisterOtp: async (payload) => {
    return await apiClient.post(ENDPOINTS.REGISTER_VERIFY_OTP, payload);
  },

  /**
   * Fetch current authenticated user's profile
   */
  getMyProfile: async () => {
    return await apiClient.get(ENDPOINTS.GET_MY_PROFILE);
  },

  /**
   * Update user profile
   * @param {Object|FormData} payload
   */
  updateMyProfile: async (payload) => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    return await apiClient.post(ENDPOINTS.UPDATE_MY_PROFILE, payload, isFormData);
  },

  /**
   * Invalidate session and logout
   */
  logout: async () => {
    try {
      return await apiClient.post(ENDPOINTS.LOGOUT);
    } catch {
      // Gracefully continue even if server call fails
      return { status: true };
    }
  },
};

export default authService;
