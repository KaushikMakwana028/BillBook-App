/**
 * BillBook API Client
 * Centralized HTTP request handler with JWT Bearer Token management
 */

import { BASE_URL } from '../config/api';

class ApiClient {
  constructor() {
    this.token = null;
  }

  /**
   * Set JWT token for authenticated requests
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Clear JWT token on logout
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Build complete URL
   */
  buildUrl(endpoint, params = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = new URL(cleanEndpoint, BASE_URL);

    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, val);
      }
    });

    return url.toString();
  }

  /**
   * Core request function
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = {},
      body = null,
      headers = {},
      isFormData = false,
    } = options;

    const url = this.buildUrl(endpoint, params);

    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    };

    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers: requestHeaders,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text();

      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text || `Server responded with status ${response.status}`);
      }

      if (!response.ok && !json.status) {
        const error = new Error(json.message || `Request failed with code ${response.status}`);
        error.response = { data: json, status: response.status };
        throw error;
      }

      return json;
    } catch (error) {
      if (!error.response) {
        error.response = {
          data: {
            status: false,
            message: error.message || 'Network request failed. Please check your internet connection.',
          },
        };
      }
      throw error;
    }
  }

  get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  }

  post(endpoint, body = {}, isFormData = false) {
    return this.request(endpoint, { method: 'POST', body, isFormData });
  }

  put(endpoint, body = {}, isFormData = false) {
    return this.request(endpoint, { method: 'PUT', body, isFormData });
  }

  delete(endpoint, body = {}) {
    return this.request(endpoint, { method: 'DELETE', body });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
