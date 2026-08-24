import API from '../utils/api';

export const scenarioService = {
  // Get scenarios with optional project & module filters
  getScenarios: async (projectId = '', moduleId = '') => {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'All') params.append('project', projectId);
    if (moduleId && moduleId !== 'All') params.append('module', moduleId);
    const response = await API.get(`/scenarios?${params.toString()}`);
    return response.data;
  },

  // Get scenario by ID
  getScenarioById: async (id) => {
    const response = await API.get(`/scenarios/${id}`);
    return response.data;
  },

  // Create scenario
  createScenario: async (data) => {
    const response = await API.post('/scenarios', data);
    return response.data;
  },

  // Update scenario
  updateScenario: async (id, data) => {
    const response = await API.put(`/scenarios/${id}`, data);
    return response.data;
  },

  // Delete scenario
  deleteScenario: async (id) => {
    const response = await API.delete(`/scenarios/${id}`);
    return response.data;
  },
};

export default scenarioService;
