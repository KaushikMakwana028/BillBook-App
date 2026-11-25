/**
 * BillBook Party / Customer Service
 * Parties, customers, suppliers & ledger management APIs
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const partyService = {
  /**
   * Get parties / customers list with optional search, type, and pagination
   * @param {Object} params - { search, type, page, limit }
   */
  getParties: async (params = {}, options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_PARTIES, params, options);
  },

  /**
   * Quick customer lookup by phone number
   * @param {string} phone
   */
  customerLookup: async (phone) => {
    const clean = String(phone).replace(/\D/g, '');
    return await apiClient.get(ENDPOINTS.CUSTOMER_LOOKUP, { phone: clean });
  },

  /**
   * Add new party / customer
   * @param {Object} payload - { name, phone, email, address, type, opening_balance }
   */
  addParty: async (payload) => {
    return await apiClient.post(ENDPOINTS.ADD_PARTY, payload);
  },

  /**
   * Update existing party
   * @param {Object} payload
   */
  updateParty: async (payload) => {
    return await apiClient.post(ENDPOINTS.UPDATE_PARTY, payload);
  },

  /**
   * Delete party by ID
   * @param {number|string} id
   */
  deleteParty: async (id) => {
    return await apiClient.post(ENDPOINTS.DELETE_PARTY, { id });
  },
};

export default partyService;
