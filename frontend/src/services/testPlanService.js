import API from '../utils/api';

export const testPlanService = {
  getTestPlans: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/test-plans?${query}`);
    return response.data;
  },

  getTestPlanById: async (id) => {
    const response = await API.get(`/test-plans/${id}`);
    return response.data;
  },

  createTestPlan: async (planData) => {
    const response = await API.post('/test-plans', planData);
    return response.data;
  },

  updateTestPlan: async (id, planData) => {
    const response = await API.put(`/test-plans/${id}`, planData);
    return response.data;
  },

  deleteTestPlan: async (id) => {
    const response = await API.delete(`/test-plans/${id}`);
    return response.data;
  },
};

export default testPlanService;
