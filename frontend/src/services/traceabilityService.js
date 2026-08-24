import API from '../utils/api';

export const traceabilityService = {
  getTraceabilityMatrix: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await API.get(`/traceability?${query}`);
    return response.data;
  },
};

export default traceabilityService;
