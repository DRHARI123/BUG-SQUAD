import API from '../utils/api';

export const reportService = {
  // Get summary counters for top dashboard bar
  getSummaryReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/reports/summary?${query}`);
    return response.data;
  },

  // Get bug breakdown report
  getBugReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/reports/bugs?${query}`);
    return response.data;
  },

  // Get project-wise report
  getProjectReport: async () => {
    const response = await API.get('/reports/projects');
    return response.data;
  },

  // Get tester performance report
  getTesterPerformanceReport: async () => {
    const response = await API.get('/reports/tester-performance');
    return response.data;
  },

  // Get execution report
  getExecutionReport: async () => {
    const response = await API.get('/reports/executions');
    return response.data;
  },
};

export default reportService;
