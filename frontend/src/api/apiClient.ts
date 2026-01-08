// Unified API Client
// Automatically switches between mock and real API based on config

import { API_CONFIG } from '../config/api.config';
import { mockApi } from './mockApi';
import api from './axios';

// Re-export types
export type { MockUser as User } from './mockData';
export type { MockRole as Role } from './mockData';
export type { MockPermission as Permission } from './mockData';

// Unified API interface
export const apiClient = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.auth.login(credentials);
      }
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
  },

  users: {
    getAll: async () => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.users.getAll();
      }
      const response = await api.get('/users');
      return response.data;
    },
    getById: async (id: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.users.getById(id);
      }
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    create: async (userData: any) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.users.create(userData);
      }
      const response = await api.post('/users', userData);
      return response.data;
    },
    update: async (id: string, userData: any) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.users.update(id, userData);
      }
      const response = await api.patch(`/users/${id}`, userData);
      return response.data;
    },
    delete: async (id: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.users.delete(id);
      }
      await api.delete(`/users/${id}`);
    },
  },

  roles: {
    getAll: async () => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.roles.getAll();
      }
      const response = await api.get('/roles');
      return response.data;
    },
    getById: async (id: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.roles.getById(id);
      }
      const response = await api.get(`/roles/${id}`);
      return response.data;
    },
    create: async (roleData: any) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.roles.create(roleData);
      }
      const response = await api.post('/roles', roleData);
      return response.data;
    },
    update: async (id: string, roleData: any) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.roles.update(id, roleData);
      }
      const response = await api.patch(`/roles/${id}`, roleData);
      return response.data;
    },
    delete: async (id: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.roles.delete(id);
      }
      await api.delete(`/roles/${id}`);
    },
  },

  permissions: {
    getByRoleId: async (roleId: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.permissions.getByRoleId(roleId);
      }
      const response = await api.get(`/permissions/role/${roleId}`);
      return response.data;
    },
    createDefaults: async (roleId: string) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.permissions.createDefaults(roleId);
      }
      const response = await api.post(`/permissions/role/${roleId}/defaults`);
      return response.data;
    },
    bulkUpdate: async (roleId: string, permissions: any[]) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.permissions.bulkUpdate(roleId, permissions);
      }
      const response = await api.put(`/permissions/role/${roleId}/bulk`, permissions);
      return response.data;
    },
  },
};

