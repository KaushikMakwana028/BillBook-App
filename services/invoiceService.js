/**
 * BillBook Invoice Settings & Templates Service
 * Template styling, color palettes, and invoice customizer
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const invoiceService = {
  /**
   * Get active invoice customization settings
   */
  getInvoiceSettings: async () => {
    return await apiClient.get(ENDPOINTS.GET_INVOICE_SETTINGS);
  },

  /**
   * Save selected template ID and color scheme
   * @param {Object} payload - { template_id, primary_color, accent_color }
   */
  saveInvoiceSettings: async ({ template_id, primary_color, accent_color }) => {
    return await apiClient.post(ENDPOINTS.SAVE_INVOICE_SETTINGS, {
      template_id,
      primary_color,
      accent_color,
    });
  },

  /**
   * Get available invoice templates list
   */
  getInvoiceTemplates: async () => {
    return await apiClient.get(ENDPOINTS.GET_INVOICE_TEMPLATES);
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
};

export default invoiceService;
