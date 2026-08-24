import API from '../utils/api';

export const aiService = {
  chat: async (payload) => {
    const response = await API.post('/ai/chat', payload);
    return response.data;
  },

  analyzeBug: async (payload) => {
    const response = await API.post('/ai/analyze-bug', payload);
    return response.data;
  },

  getBugSummary: async (payload) => {
    const response = await API.post('/ai/bug-summary', payload);
    return response.data;
  },

  suggestRootCause: async (payload) => {
    const response = await API.post('/ai/root-cause', payload);
    return response.data;
  },

  checkSimilarBugs: async (payload) => {
    const response = await API.post('/ai/similar-bugs', payload);
    return response.data;
  },

  generateTestCases: async (payload) => {
    const response = await API.post('/ai/generate-test-cases', payload);
    return response.data;
  },

  generateScenarios: async (payload) => {
    const response = await API.post('/ai/generate-scenarios', payload);
    return response.data;
  },

  generateTestData: async (payload) => {
    const response = await API.post('/ai/generate-test-data', payload);
    return response.data;
  },

  suggestRegressionTests: async (payload) => {
    const response = await API.post('/ai/regression-tests', payload);
    return response.data;
  },

  analyzeRequirement: async (payload) => {
    const response = await API.post('/ai/analyze-requirement', payload);
    return response.data;
  },

  generateAcceptanceCriteria: async (payload) => {
    const response = await API.post('/ai/acceptance-criteria', payload);
    return response.data;
  },

  analyzeRelease: async (payload) => {
    const response = await API.post('/ai/release-analysis', payload);
    return response.data;
  },

  bugTriage: async () => {
    const response = await API.post('/ai/bug-triage', {});
    return response.data;
  },

  getAIUsage: async () => {
    const response = await API.get('/ai/usage');
    return response.data;
  },

  getAIHistory: async () => {
    const response = await API.get('/ai/history');
    return response.data;
  },

  getAISettings: async () => {
    const response = await API.get('/admin/ai-settings');
    return response.data;
  },

  updateAISettings: async (settings) => {
    const response = await API.put('/admin/ai-settings', settings);
    return response.data;
  },
};

export default aiService;
