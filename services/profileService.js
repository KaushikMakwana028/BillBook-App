/**
 * BillBook Profile & Business Settings Service
 * User profile, business information, signature & invoice template settings
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const profileService = {
  /**
   * Fetch current authenticated user's profile and business details
   */
  getMyProfile: async () => {
    return await apiClient.get(ENDPOINTS.GET_MY_PROFILE);
  },

  /**
   * Update user and business profile details
   * @param {Object|FormData} payload
   */
  updateMyProfile: async (payload) => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    return await apiClient.post(ENDPOINTS.UPDATE_MY_PROFILE, payload, isFormData);
  },

  /**
   * Fetch invoice customizer settings
   */
  getInvoiceSettings: async () => {
    return await apiClient.get(ENDPOINTS.GET_INVOICE_SETTINGS);
  },

  /**
   * Save invoice styling and customization settings
   * @param {Object} payload
   */
  saveInvoiceSettings: async (payload) => {
    return await apiClient.post(ENDPOINTS.SAVE_INVOICE_SETTINGS, payload);
  },

  /**
   * Upload business digital signature
   * @param {FormData} formData
   */
  uploadSignature: async (formData) => {
    return await apiClient.post(ENDPOINTS.UPLOAD_SIGNATURE, formData, true);
  },

  /**
   * Remove current signature
   */
  removeSignature: async () => {
    return await apiClient.post(ENDPOINTS.REMOVE_SIGNATURE);
  },

  /**
   * Get invoice templates list
   */
  getInvoiceTemplates: async () => {
    return await apiClient.get(ENDPOINTS.GET_INVOICE_TEMPLATES);
  },
};

export default profileService;
