import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

export const api = {
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product) => {
    const response = await apiClient.post('/products', product);
    return response.data;
  },

  updateProduct: async (id, product) => {
    const response = await apiClient.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  register: async (user) => {
    const response = await apiClient.post('/auth/register', user);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }
};