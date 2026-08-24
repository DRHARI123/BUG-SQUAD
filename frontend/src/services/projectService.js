import API from '../utils/api';

export const projectService = {
  // Get all projects with optional search & status filter
  getProjects: async (search = '', status = 'All') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status);
    const response = await API.get(`/projects?${params.toString()}`);
    return response.data;
  },

  // Get project by ID
  getProjectById: async (id) => {
    const response = await API.get(`/projects/${id}`);
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await API.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (id, projectData) => {
    const response = await API.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await API.delete(`/projects/${id}`);
    return response.data;
  },
};

export default projectService;
