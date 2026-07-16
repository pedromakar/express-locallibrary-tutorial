import api from './api';

export const adminService = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getOrders: async () => {
    const res = await api.get('/admin/orders');
    return res.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await api.put(`/admin/orders/${orderId}/status`, { status });
    return res.data;
  },

  getCarts: async () => {
    const res = await api.get('/admin/carts');
    return res.data;
  },

  getNotifications: async () => {
    const res = await api.get('/admin/notifications');
    return res.data;
  },

  readNotification: async (id) => {
    const res = await api.put(`/admin/notifications/${id}/read`);
    return res.data;
  },

  readAllNotifications: async () => {
    const res = await api.put('/admin/notifications/read-all');
    return res.data;
  },

  getReports: async () => {
    const res = await api.get('/admin/reports');
    return res.data;
  }
};

export default adminService;
