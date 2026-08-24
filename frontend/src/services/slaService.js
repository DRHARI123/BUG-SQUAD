import API from '../utils/api';

export const slaService = {
  getSLAConfigs: async () => {
    const response = await API.get('/sla');
    return response.data;
  },

  updateSLAConfigs: async (configs) => {
    const response = await API.post('/sla', { configs });
    return response.data;
  },

  getSLADashboard: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/sla/dashboard?${query}`);
    return response.data;
  },
};

export default slaService;
