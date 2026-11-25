/**
 * BillBook WhatsApp Service
 * Status check, QR code generation, session logout, and invoice dispatch via Meta Cloud API / Connected WhatsApp
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const whatsappService = {
  /**
   * Check current WhatsApp connection status
   */
  getStatus: async () => {
    return await apiClient.get(ENDPOINTS.WHATSAPP_STATUS);
  },

  /**
   * Fetch live WhatsApp Web pairing QR code Data URI
   */
  getQr: async () => {
    return await apiClient.get(ENDPOINTS.WHATSAPP_QR);
  },

  /**
   * Request 8-digit Pairing Code for linking on single mobile device
   * @param {string} phone
   */
  getPairingCode: async (phone = '') => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    return await apiClient.post(ENDPOINTS.WHATSAPP_PAIRING_CODE, { phone: cleanPhone });
  },

  /**
   * Invalidate WhatsApp web session
   */
  logout: async () => {
    return await apiClient.post(ENDPOINTS.WHATSAPP_LOGOUT);
  },

  /**
   * Send or re-send invoice via WhatsApp
   * If user's WhatsApp is not connected, backend routes automatically via
   * BillBook Official Account (Meta Cloud API)
   * @param {number|string} saleId
   * @param {string} phone
   */
  sendInvoice: async (saleId, phone = '') => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    return await apiClient.post(ENDPOINTS.SEND_INVOICE_WHATSAPP, {
      sale_id: saleId,
      phone: cleanPhone,
    });
  },
};

export default whatsappService;
