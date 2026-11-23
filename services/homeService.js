/**
 * BillBook Home / Dashboard Service
 * Fetches analytics, KPI metrics, recent sales, and stock alerts
 */

import { ENDPOINTS } from '../config/api';
import apiClient from './apiClient';

export const homeService = {
  /**
   * Fetch dashboard metrics and analytics
   * @param {Object} params - { filter: 'day'|'week'|'month'|'year'|'custom', from_date, to_date, month_picker, year_picker }
   */
  getDashboardData: async (params = {}) => {
    return await apiClient.get(ENDPOINTS.DASHBOARD, params);
  },
};

export default homeService;
