import API from '../utils/api';

export const preferenceService = {
  getUserPreferences: async () => {
    const response = await API.get('/preferences');
    return response.data;
  },

  updateUserPreferences: async (preferences) => {
    const response = await API.put('/preferences', preferences);
    return response.data;
  },
};

export default preferenceService;
