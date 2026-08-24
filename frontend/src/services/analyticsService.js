import API from '../utils/api';

export const analyticsService = {
  getOverview: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/analytics/overview?${query}`);
    return response.data;
  },

  getBugAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/analytics/bugs?${query}`);
    return response.data;
  },

  getTeamAnalytics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/analytics/team?${query}`);
    return response.data;
  },

  generateAIInsights: async (payload) => {
    const response = await API.post('/analytics/ai-insights', payload);
    return response.data;
  },
};

export default analyticsService;
