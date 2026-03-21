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
  removeAccessToken() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = tokenStorage.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingRequests = [];

function resolvePendingRequests(error, newToken = null) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });

  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/register') &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!accessToken || !refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          {},
          {
            headers: {
              'x-refresh-token': refreshToken
            }
          }
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
  register: async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  login: async (payload) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  refresh: async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    const response = await apiClient.post(
      '/auth/refresh',
      {},
      {
        headers: {
          'x-refresh-token': refreshToken || ''
        }
      }
    );

    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (payload) => {
    const response = await apiClient.post('/products', payload);
    return response.data;
  },

  updateProduct: async (id, payload) => {
    const response = await apiClient.put(`/products/${id}`, payload);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      await apiClient.post(
        '/auth/logout',
        {},
        {
          headers: {
            'x-refresh-token': refreshToken || ''
          }
        }
      );
    } finally {
      tokenStorage.clear();
    }
  }
};