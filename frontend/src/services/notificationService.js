import API from '../utils/api';

export const notificationService = {
  // Get user notifications
  getNotifications: async () => {
    const response = await API.get('/notifications');
    return response.data?.notifications || (Array.isArray(response.data) ? response.data : []);
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await API.patch(`/notifications/${id}/read`);
    return response.data;
  },
};

export default notificationService;
