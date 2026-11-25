/**
 * BillBook Category Service
 * CRUD API methods for product categories
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const categoryService = {
  /**
   * Fetch categories list with optional pagination & search
   * @param {Object} params - { page, limit, search }
   */
  getCategories: async (params = {}) => {
    return await apiClient.get(ENDPOINTS.GET_CATEGORIES, params);
  },

  /**
   * Get single category details
   * @param {number|string} categoryId
   */
  getCategoryDetail: async (categoryId) => {
    return await apiClient.get(ENDPOINTS.GET_CATEGORY_DETAIL, { category_id: categoryId });
  },

  /**
   * Add a new category
   * @param {Object} payload - { name, status }
   */
  addCategory: async (payload) => {
    return await apiClient.post(ENDPOINTS.ADD_CATEGORY, payload);
  },

  /**
   * Update existing category
   * @param {Object} payload - { id, name, status }
   */
  updateCategory: async (payload) => {
    return await apiClient.post(ENDPOINTS.UPDATE_CATEGORY, payload);
  },

  /**
   * Delete category by ID
   * @param {number|string} id
   */
  deleteCategory: async (id) => {
    return await apiClient.post(ENDPOINTS.DELETE_CATEGORY, { id });
  },

  /**
   * Get all products belonging to a category
   * @param {number|string} categoryId
   */
  getProductsByCategory: async (categoryId) => {
    return await apiClient.get(ENDPOINTS.GET_PRODUCTS_BY_CATEGORY, { category_id: categoryId });
  },
};

export default categoryService;
