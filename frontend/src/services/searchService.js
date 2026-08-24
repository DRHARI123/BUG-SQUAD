import API from '../utils/api';

export const searchService = {
  globalSearch: async (query) => {
    const response = await API.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export default searchService;
