import axios from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let isRefreshing = false;
let pendingRequests = [];

function resolvePendingRequests(error, newToken = null) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = tokenStorage.getRefreshToken();

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/register') &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          {},
          { headers: { 'x-refresh-token': refreshToken } }
        );

        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;

        tokenStorage.setAccessToken(newAccessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        resolvePendingRequests(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        resolvePendingRequests(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  register: async (payload) => (await apiClient.post('/auth/register', payload)).data,
  login: async (payload) => (await apiClient.post('/auth/login', payload)).data,
  getMe: async () => (await apiClient.get('/auth/me')).data,
  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      await apiClient.post('/auth/logout', {}, {
        headers: { 'x-refresh-token': refreshToken || '' }
      });
    } finally {
      tokenStorage.clear();
    }
  },

  getProducts: async () => (await apiClient.get('/products')).data,
  getProductById: async (id) => (await apiClient.get(`/products/${id}`)).data,
  createProduct: async (payload) => (await apiClient.post('/products', payload)).data,
  updateProduct: async (id, payload) => (await apiClient.put(`/products/${id}`, payload)).data,
  deleteProduct: async (id) => (await apiClient.delete(`/products/${id}`)).data,

  getUsers: async () => (await apiClient.get('/users')).data,
  getUserById: async (id) => (await apiClient.get(`/users/${id}`)).data,
  updateUser: async (id, payload) => (await apiClient.put(`/users/${id}`, payload)).data,
  blockUser: async (id) => (await apiClient.delete(`/users/${id}`)).data
};