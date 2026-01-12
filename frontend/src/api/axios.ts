import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_CONFIG } from '../config/api.config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
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
    } else {
      console.warn('⚠️ No token found in auth store for request to:', config.url);
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
    // Handle 401 (Unauthorized) - token is invalid/expired/missing
    if (error.response?.status === 401) {
      const hasAuthHeader = error.config?.headers?.Authorization;
      const isLoginPage = window.location.pathname.includes('/login');
      const authState = useAuthStore.getState();

      console.error('🔴 401 Unauthorized:', {
        url: error.config?.url,
        hasToken: !!authState.token,
        hasAuthHeader: !!hasAuthHeader,
        isAuthenticated: authState.isAuthenticated,
        isLoginPage,
      });

      // If no token in store or no auth header, user needs to login
      if (!authState.token || !hasAuthHeader) {
        if (!isLoginPage) {
          console.warn('⚠️ No token found. Redirecting to login...');
          setTimeout(() => {
            authState.logout();
            window.location.href = '/login';
          }, 500);
        }
        return Promise.reject(error);
      }

      // Token exists but is invalid/expired
      // For protected resources, let the component handle the error
      // This prevents auto-logout when user clicks on Users menu
      const requestUrl = error.config?.url || '';
      const isProtectedResource =
        requestUrl.includes('/users') ||
        requestUrl.includes('/roles') ||
        requestUrl.includes('/permissions');

      // Let protected resources handle their own errors (show error UI, don't auto-redirect)
      if (isProtectedResource) {
        return Promise.reject(error);
      }

      // For non-protected resources, auto-redirect on 401 errors
      if (!isLoginPage) {
        console.warn('⚠️ Token invalid/expired. Redirecting to login...');
        setTimeout(() => {
          authState.logout();
          window.location.href = '/login';
        }, 500);
      }
    }
    // For 403 (Forbidden) and other errors, just reject without logging out
    // Components will handle these errors appropriately
    return Promise.reject(error);
  }
);

export default api;

