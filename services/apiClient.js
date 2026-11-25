/**
 * BillBook API Client
 * Centralized HTTP request handler with JWT Bearer Token management,
 * timeout protection, in-memory caching for ultra-fast screen loading, and error handling.
 */

import { BASE_URL } from '../config/api';
import storage from '../utils/storage';

class ApiClient {
  constructor() {
    this.token = null;
    this.cache = new Map();
    this.defaultTimeout = 15000; // 15 seconds max timeout
  }

  /**
   * Set JWT token for authenticated requests
   */
  setToken(token) {
    this.token = token;
    this.cache.clear(); // Clear cache when switching users/token
  }

  /**
   * Clear JWT token on logout
   */
  clearToken() {
    this.token = null;
    this.cache.clear();
  }

  /**
   * Build complete URL with query string
   */
  buildUrl(endpoint, params = {}) {
    const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    let url = `${base}${cleanEndpoint}`;

    const paramKeys = Object.keys(params).filter((key) => {
      const val = params[key];
      return val !== undefined && val !== null && val !== '';
    });

    if (paramKeys.length > 0) {
      const queryString = paramKeys
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    return url;
  }

  /**
   * Core request function with timeout & cache
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      params = {},
      body = null,
      headers = {},
      isFormData = false,
      useCache = true, // Ultra-fast screen loading via in-memory cache
      cacheTTL = 30000, // 30 seconds default cache TTL
      timeout = this.defaultTimeout,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const cacheKey = `${method}:${url}`;

    // Return cached response if valid and requested
    if (method === 'GET' && useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }

    const requestHeaders = {
      Accept: 'application/json',
      ...headers,
    };

    if (!isFormData) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    if (!this.token) {
      try {
        const storedToken = await storage.getItem('billbook_token');
        if (storedToken) {
          this.token = storedToken;
        }
      } catch (e) {
        // ignore storage read error
      }
    }

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    // Set up AbortController timeout to prevent hanging connections
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;

    const config = {
      method,
      headers: requestHeaders,
      signal: controller ? controller.signal : undefined,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      if (timeoutId) clearTimeout(timeoutId);

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

      // Store in memory cache for GET requests
      if (method === 'GET' && json?.status) {
        this.cache.set(cacheKey, { timestamp: Date.now(), data: json });
      }

      // Invalidate cache on mutations
      if (method !== 'GET') {
        this.cache.clear();
      }

      return json;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutErr = new Error('Connection timed out. Please check your network connection.');
        timeoutErr.response = {
          data: { status: false, message: 'Request timed out. Please try again.' },
          status: 408,
        };
        throw timeoutErr;
      }

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

  clearCache() {
    this.cache.clear();
  }

  get(endpoint, params = {}, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      params,
      useCache: options.useCache !== undefined ? options.useCache : true,
      cacheTTL: options.cacheTTL || 30000,
      ...options,
    });
  }

  post(endpoint, body = {}, isFormData = false, options = {}) {
    return this.request(endpoint, { method: 'POST', body, isFormData, ...options });
  }

  put(endpoint, body = {}, isFormData = false, options = {}) {
    return this.request(endpoint, { method: 'PUT', body, isFormData, ...options });
  }

  delete(endpoint, body = {}, options = {}) {
    return this.request(endpoint, { method: 'DELETE', body, ...options });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
