import API from '../utils/api';

export const testCaseService = {
  // Get test cases with search, filters, pagination, and sorting
  getTestCases: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const response = await API.get(`/test-cases?${query.toString()}`);
    return response.data;
  },

  // Get single test case by ID or TC-0001
  getTestCaseById: async (id) => {
    const response = await API.get(`/test-cases/${id}`);
    return response.data;
  },

  // Create test case
  createTestCase: async (data) => {
    const response = await API.post('/test-cases', data);
    return response.data;
  },

  // Update test case
  updateTestCase: async (id, data) => {
    const response = await API.put(`/test-cases/${id}`, data);
    return response.data;
  },

  // Delete test case
  deleteTestCase: async (id) => {
    const response = await API.delete(`/test-cases/${id}`);
    return response.data;
  },

  // Duplicate test case
  duplicateTestCase: async (id) => {
    const response = await API.post(`/test-cases/${id}/duplicate`);
    return response.data;
  },

  // Get execution history for a test case
  getExecutions: async (id) => {
    const response = await API.get(`/test-cases/${id}/executions`);
    return response.data;
  },

  // Record test case execution
  executeTestCase: async (id, executionData) => {
    const response = await API.post(`/test-cases/${id}/executions`, executionData);
    return response.data;
  },
};

export default testCaseService;
