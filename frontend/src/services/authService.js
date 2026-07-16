import api from './api';

export const authService = {
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  register: async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  }
};

export default authService;
