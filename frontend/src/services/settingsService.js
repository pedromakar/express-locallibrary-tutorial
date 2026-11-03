import api from './api';

export const settingsService = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },

  updateSettings: async (settingsData) => {
    const res = await api.put('/settings', settingsData);
    return res.data;
  }
};

export default settingsService;
