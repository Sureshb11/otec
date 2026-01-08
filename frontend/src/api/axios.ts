import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 (Unauthorized) - this means token is invalid/expired/missing
    // Don't logout on 403 (Forbidden) - this just means user doesn't have permission
    if (error.response?.status === 401) {
      // 401 means authentication failed - token is invalid, expired, or missing
      // Logout and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    // For 403 (Forbidden) and other errors, just reject without logging out
    // Components will handle these errors appropriately
    return Promise.reject(error);
  }
);

export default api;

