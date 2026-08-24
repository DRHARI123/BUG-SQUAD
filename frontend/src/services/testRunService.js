import API from '../utils/api';

export const testRunService = {
  getTestRuns: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/test-runs?${query}`);
    return response.data;
  },

  getTestRunById: async (id) => {
    const response = await API.get(`/test-runs/${id}`);
    return response.data;
  },

  createTestRun: async (runData) => {
    const response = await API.post('/test-runs', runData);
    return response.data;
  },

  executeTestCase: async (runId, execData) => {
    const response = await API.post(`/test-runs/${runId}/execute`, execData);
    return response.data;
  },

  updateTestRun: async (id, runData) => {
    const response = await API.put(`/test-runs/${id}`, runData);
    return response.data;
  },

  deleteTestRun: async (id) => {
    const response = await API.delete(`/test-runs/${id}`);
    return response.data;
  },
};

export default testRunService;
