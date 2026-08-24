import API from '../utils/api';

export const bugService = {
  // Get bugs with search, filters, pagination, and sorting
  getBugs: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const response = await API.get(`/bugs?${query.toString()}`);
    return response.data;
  },

  // Get bug by ID or bugId string
  getBugById: async (id) => {
    const response = await API.get(`/bugs/${id}`);
    return response.data;
  },

  // Create new bug
  createBug: async (bugData) => {
    const response = await API.post('/bugs', bugData);
    return response.data;
  },

  // Update bug
  updateBug: async (id, bugData) => {
    const response = await API.put(`/bugs/${id}`, bugData);
    return response.data;
  },

  // Delete bug
  deleteBug: async (id) => {
    const response = await API.delete(`/bugs/${id}`);
    return response.data;
  },

  // Change bug status
  changeStatus: async (id, status, comment = '') => {
    const response = await API.patch(`/bugs/${id}/status`, { status, comment });
    return response.data;
  },

  // Assign bug
  assignBug: async (id, assignedTo) => {
    const response = await API.patch(`/bugs/${id}/assign`, { assignedTo });
    return response.data;
  },

  // Get bug timeline history
  getBugHistory: async (id) => {
    const response = await API.get(`/bugs/${id}/history`);
    return response.data;
  },

  // Get bug comments
  getComments: async (id) => {
    const response = await API.get(`/bugs/${id}/comments`);
    return response.data;
  },

  // Add bug comment
  addComment: async (id, comment) => {
    const response = await API.post(`/bugs/${id}/comments`, { comment });
    return response.data;
  },

  // Delete bug comment
  deleteComment: async (id, commentId) => {
    const response = await API.delete(`/bugs/${id}/comments/${commentId}`);
    return response.data;
  },
};

export default bugService;
