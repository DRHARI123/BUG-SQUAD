import API from '../utils/api';

export const releaseService = {
  getReleases: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/releases?${query}`);
    return response.data;
  },

  getReleaseById: async (id) => {
    const response = await API.get(`/releases/${id}`);
    return response.data;
  },

  createRelease: async (releaseData) => {
    const response = await API.post('/releases', releaseData);
    return response.data;
  },

  signOffRelease: async (id, signOffData) => {
    const response = await API.post(`/releases/${id}/sign-off`, signOffData);
    return response.data;
  },

  updateRelease: async (id, releaseData) => {
    const response = await API.put(`/releases/${id}`, releaseData);
    return response.data;
  },

  deleteRelease: async (id) => {
    const response = await API.delete(`/releases/${id}`);
    return response.data;
  },
};

export default releaseService;
