/**
 * BillBook Product Service
 * Catalog management, barcode generation, stock tracking & CRUD APIs
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const productService = {
  /**
   * Get products list with filters, search, and pagination
   * @param {Object} params - { page, limit, search, category_id, stock_filter, status_filter }
   */
  getProducts: async (params = {}, options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_PRODUCTS, params, options);
  },

  /**
   * Get single product details by ID
   * @param {number|string} productId
   */
  getProductDetail: async (productId, options = {}) => {
    return await apiClient.get(ENDPOINTS.GET_PRODUCT_DETAIL, { product_id: productId }, options);
  },

  /**
   * Create a new product (supports JSON or FormData with image)
   * @param {Object|FormData} payload
   */
  addProduct: async (payload) => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    return await apiClient.post(ENDPOINTS.ADD_PRODUCT, payload, isFormData);
  },

  /**
   * Update existing product
   * @param {Object|FormData} payload
   */
  updateProduct: async (payload) => {
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    return await apiClient.post(ENDPOINTS.UPDATE_PRODUCT, payload, isFormData);
  },

  /**
   * Delete product by ID
   * @param {number|string} id
   */
  deleteProduct: async (id) => {
    return await apiClient.post(ENDPOINTS.DELETE_PRODUCT, { id });
  },

  /**
   * Generate a unique barcode string
   */
  generateBarcode: async () => {
    return await apiClient.get(ENDPOINTS.GENERATE_BARCODE);
  },

  /**
   * Get printable barcode sheet data
   * @param {string} idsParam - format: "id:copies,id:copies"
   */
  getBarcodeSheet: async (idsParam) => {
    return await apiClient.get(ENDPOINTS.GET_BARCODE_SHEET, { ids: idsParam });
  },
};

export default productService;
