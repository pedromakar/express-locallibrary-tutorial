import api from './api';

export const orderService = {
  create: async (orderData) => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },

  getByUser: async (userId) => {
    const res = await api.get(`/orders/${userId}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/order/${id}`);
    return res.data;
  }
};

export default orderService;
