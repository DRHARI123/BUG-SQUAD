import API from '../utils/api';

export const moduleService = {
  // Get modules for a project
  getModules: async (projectId = '') => {
    const url = projectId ? `/modules?project=${projectId}` : '/modules';
    const response = await API.get(url);
    return response.data;
  },

  // Get module by ID
  getModuleById: async (id) => {
    const response = await API.get(`/modules/${id}`);
    return response.data;
  },

  // Create module
  createModule: async (moduleData) => {
    const response = await API.post('/modules', moduleData);
    return response.data;
  },

  // Update module
  updateModule: async (id, moduleData) => {
    const response = await API.put(`/modules/${id}`, moduleData);
    return response.data;
  },

  // Delete module
  deleteModule: async (id) => {
    const response = await API.delete(`/modules/${id}`);
    return response.data;
  },
};

export default moduleService;
