import API from '../utils/api';

export const userService = {
  // Get users with optional search, filter, and pagination params
  getUsers: async (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const response = await API.get(`/users?${query.toString()}`);
    return response.data;
  },

  // Get single user by ID
  getUserById: async (id) => {
    const response = await API.get(`/users/${id}`);
    return response.data;
  },

  // Create user (Admin)
  createUser: async (userData) => {
    const response = await API.post('/users', userData);
    return response.data;
  },

  // Update user profile/role/status
  updateUser: async (id, userData) => {
    const response = await API.put(`/users/${id}`, userData);
    return response.data;
  },

  // Toggle user Active/Inactive status
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Reset user password
  resetPassword: async (id, newPassword) => {
    const response = await API.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Delete/Deactivate user
  deleteUser: async (id) => {
    const response = await API.delete(`/users/${id}`);
    return response.data;
  },
};

export default userService;
