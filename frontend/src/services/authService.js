import API from '../utils/api';

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('bugsquad_token', response.data.token);
    }
    return response.data;
  },

  // Register user
  register: async (name, email, password, role) => {
    const response = await API.post('/auth/register', { name, email, password, role });
    if (response.data.token) {
      localStorage.setItem('bugsquad_token', response.data.token);
    }
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('bugsquad_token');
  },
};

export default authService;
