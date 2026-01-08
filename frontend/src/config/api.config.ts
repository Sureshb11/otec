// API Configuration
// Toggle between mock and real API

export const API_CONFIG = {
  // Set to true to use mock data (UI-first development)
  // Set to false to use real API (when backend is ready)
  // Defaults to false to use real backend API
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API === 'true',
  
  // API Base URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
};

// Helper to check if we're using mock API
export const isUsingMockApi = () => API_CONFIG.USE_MOCK_API;

