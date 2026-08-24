import API from '../utils/api';

export const adminService = {
  // Get admin stats & system health
  getAdminStats: async () => {
    const response = await API.get('/admin/stats');
    return response.data;
  },

  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/admin/activity?${query}`);
    return response.data;
  },

  // Get system settings
  getSettings: async () => {
    const response = await API.get('/admin/settings');
    return response.data;
  },

  // Update system settings
  updateSettings: async (settingsData) => {
    const response = await API.put('/admin/settings', settingsData);
    return response.data;
  },
};

export default adminService;
