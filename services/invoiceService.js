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
  getInvoiceSettings: async (options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_INVOICE_SETTINGS, {}, options);
  },

  /**
   * Save selected template ID and color scheme
   * @param {Object} payload - { template_id, primary_color, accent_color, ... }
   */
  saveInvoiceSettings: async (payload = {}) => {
    const cleanPayload = {};
    if (payload.template_id !== undefined) cleanPayload.template_id = payload.template_id;
    if (payload.primary_color !== undefined) cleanPayload.primary_color = payload.primary_color;
    if (payload.accent_color !== undefined) cleanPayload.accent_color = payload.accent_color;
    if (payload.signature_url !== undefined) cleanPayload.signature_url = payload.signature_url;
    return await apiClient.post(ENDPOINTS.SAVE_INVOICE_SETTINGS, cleanPayload);
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
