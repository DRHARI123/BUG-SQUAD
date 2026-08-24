import API from '../utils/api';

export const requirementService = {
  getRequirements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/requirements?${query}`);
    return response.data;
  },

  getRequirementById: async (id) => {
    const response = await API.get(`/requirements/${id}`);
    return response.data;
  },

  createRequirement: async (reqData) => {
    const response = await API.post('/requirements', reqData);
    return response.data;
  },

  updateRequirement: async (id, reqData) => {
    const response = await API.put(`/requirements/${id}`, reqData);
    return response.data;
  },

  deleteRequirement: async (id) => {
    const response = await API.delete(`/requirements/${id}`);
    return response.data;
  },
};

export default requirementService;
