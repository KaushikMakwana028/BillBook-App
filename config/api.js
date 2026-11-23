/**
 * BillBook API Configuration & Endpoints
 * Base URL & all API endpoint routes
 */

export const BASE_URL = 'https://billbook.visiontechnolabs.com/';

export const ENDPOINTS = {
  // Authentication
  LOGIN: 'api/login',
  SEND_OTP: 'api/send-otp',
  RESEND_OTP: 'api/resend-otp',
  VERIFY_OTP: 'api/verify-otp',
  REGISTER: 'api/register',
  REGISTER_VERIFY_OTP: 'api/register-verify-otp',
  LOGOUT: 'api/logout',
  GET_MY_PROFILE: 'api/get-my-profile',
  UPDATE_MY_PROFILE: 'api/update-my-profile',

  // Dashboard / Home
  DASHBOARD: 'api/dashboard',

  // Categories
  GET_CATEGORIES: 'api/get-category-list',
  GET_CATEGORY_DETAIL: 'api/get-category-detail',
  GET_PRODUCTS_BY_CATEGORY: 'api/get-products-by-category',
  ADD_CATEGORY: 'api/add-category',
  UPDATE_CATEGORY: 'api/update-category',
  DELETE_CATEGORY: 'api/delete-category',

  // Products
  GET_PRODUCTS: 'api/get-product-list',
  GET_PRODUCT_DETAIL: 'api/get-product-detail',
  ADD_PRODUCT: 'api/add-product',
  UPDATE_PRODUCT: 'api/update-product',
  DELETE_PRODUCT: 'api/delete-product',
  GENERATE_BARCODE: 'api/generate-barcode',
  GET_BARCODE_SHEET: 'api/get-barcode-sheet',

  // Parties / Customers
  GET_PARTIES: 'api/get-parties-list',
  CUSTOMER_LOOKUP: 'api/customer-lookup',
  ADD_PARTY: 'api/add-party',
  UPDATE_PARTY: 'api/update-party',
  DELETE_PARTY: 'api/delete-party',

  // Sales / Invoices
  GET_SALES: 'api/get-sales-list',
  GET_SALE_DETAIL: 'api/get-sale-detail',
  ADD_SALE: 'api/add-sale',
  UPDATE_SALE: 'api/update-sale',
  DELETE_SALE: 'api/delete-sale',
  GET_INVOICE_SETTINGS: 'api/get-invoice-settings',
  SAVE_INVOICE_SETTINGS: 'api/save-invoice-settings',
  UPLOAD_SIGNATURE: 'api/upload-signature',
  REMOVE_SIGNATURE: 'api/remove-signature',
  GET_INVOICE_TEMPLATES: 'api/get-invoice-templates',
  ADD_INVOICE_TEMPLATE: 'api/add-invoice-template',
  DELETE_INVOICE_TEMPLATE: 'api/delete-invoice-template',

  // WhatsApp Integration
  WHATSAPP_STATUS: 'api/whatsapp-status',
  WHATSAPP_QR: 'api/whatsapp-qr',
  WHATSAPP_LOGOUT: 'api/whatsapp-logout',
  SEND_INVOICE_WHATSAPP: 'api/send-invoice-whatsapp',
};

export default {
  BASE_URL,
  ENDPOINTS,
};
