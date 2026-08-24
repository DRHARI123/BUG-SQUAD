import API from '../utils/api';

export const testSuiteService = {
  getTestSuites: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/test-suites?${query}`);
    return response.data;
  },

  getTestSuiteById: async (id) => {
    const response = await API.get(`/test-suites/${id}`);
    return response.data;
  },

  createTestSuite: async (suiteData) => {
    const response = await API.post('/test-suites', suiteData);
    return response.data;
  },

  updateTestSuite: async (id, suiteData) => {
    const response = await API.put(`/test-suites/${id}`, suiteData);
    return response.data;
  },

  deleteTestSuite: async (id) => {
    const response = await API.delete(`/test-suites/${id}`);
    return response.data;
  },
};

export default testSuiteService;
