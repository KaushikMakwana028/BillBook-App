/**
 * BillBook Sales & Invoices Service
 * Invoicing, billing history, payment tracking & CRUD APIs
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const salesService = {
  /**
   * Get sales/invoices list with search, date filters, and pagination
   * @param {Object} params - { search, date_from, date_to, page, limit }
   */
  getSales: async (params = {}, options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_SALES, params, options);
  },

  /**
   * Get single invoice / sale detail with line items
   * @param {number|string} saleId
   */
  getSaleDetail: async (saleId, options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_SALE_DETAIL, { sale_id: saleId }, options);
  },

  /**
   * Create a new sale with line items and invoice generation
   * @param {Object} payload
   */
  createSale: async (payload) => {
    return await apiClient.post(ENDPOINTS.ADD_SALE, payload);
  },

  /**
   * Update existing sale
   * @param {Object} payload
   */
  updateSale: async (payload) => {
    return await apiClient.post(ENDPOINTS.UPDATE_SALE, payload);
  },

  /**
   * Delete sale by ID
   * @param {number|string} saleId
   */
  deleteSale: async (saleId) => {
    return await apiClient.post(ENDPOINTS.DELETE_SALE, { id: saleId, sale_id: saleId });
  },
};

export default salesService;
