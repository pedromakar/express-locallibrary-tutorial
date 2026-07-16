import api from './api';

export const productService = {
  getAll: async () => {
    const res = await api.get('/products');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  create: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },

  update: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  }
};

export default productService;
