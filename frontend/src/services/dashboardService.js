import API from '../utils/api';

export const dashboardService = {
  // Get dashboard 8 stats cards data
  getStats: async () => {
    const response = await API.get('/dashboard/stats');
    return response.data;
  },

  // Get chart datasets
  getCharts: async () => {
    const response = await API.get('/dashboard/charts');
    return response.data;
  },

  // Get recent activities
  getRecentActivity: async () => {
    const response = await API.get('/dashboard/recent-activity');
    return response.data;
  },

  // Get recent bugs
  getRecentBugs: async () => {
    const response = await API.get('/dashboard/recent-bugs');
    return response.data;
  },
};

export default dashboardService;
