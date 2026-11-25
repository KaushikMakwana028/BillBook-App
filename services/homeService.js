/**
 * BillBook Home / Dashboard Service
 * Fetches analytics, KPI metrics, sales/profit charts, recent sales, and stock alerts
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const homeService = {
  /**
   * Fetch dashboard metrics, charts, and analytics
   * @param {Object} params - { filter: 'day'|'week'|'month'|'year'|'custom', from_date, to_date, month_picker, year_picker }
   * @param {boolean} bypassCache - force network reload (e.g. on pull-to-refresh)
   */
  getDashboardData: async (params = {}, bypassCache = false) => {
    return await apiClient.get(ENDPOINTS.DASHBOARD, params, {
      useCache: !bypassCache,
      cacheTTL: 20000, // 20s fast cache
    });
  },
};

export default homeService;
