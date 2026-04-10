// Unified API Client — uses real backend exclusively

import api from './axios';

// Shared types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: Array<{ id: string; name: string } | string>;
  isActive?: boolean;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  allowed: boolean;
}

export const apiClient = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
  },

  users: {
    getAll: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    create: async (userData: any) => {
      const response = await api.post('/users', userData);
      return response.data;
    },
    update: async (id: string, userData: any) => {
      const response = await api.patch(`/users/${id}`, userData);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
  },

  roles: {
    getAll: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    },
    create: async (roleData: any) => {
      const response = await api.post('/roles', roleData);
      return response.data;
    },
    update: async (id: string, roleData: any) => {
      const response = await api.patch(`/roles/${id}`, roleData);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/roles/${id}`);
    },
  },

  permissions: {
    getByRoleId: async (roleId: string) => {
      const response = await api.get(`/permissions/role/${roleId}`);
      return response.data;
    },
    createDefaults: async (roleId: string) => {
      const response = await api.post(`/permissions/role/${roleId}/defaults`);
      return response.data;
    },
    bulkUpdate: async (roleId: string, permissions: any[]) => {
      const response = await api.put(`/permissions/role/${roleId}/bulk`, permissions);
      return response.data;
    },
  },

  // Business Entity APIs
  customers: {
    getAll: async () => {
      const response = await api.get('/customers');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/customers', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/customers/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
  },

  locations: {
    getAll: async () => {
      const response = await api.get('/locations');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/locations/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/locations', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/locations/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/locations/${id}`);
    },
  },

  rigs: {
    getAll: async () => {
      const response = await api.get('/rigs');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/rigs/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/rigs', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/rigs/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/rigs/${id}`);
    },
  },

  tools: {
    getAll: async () => {
      const response = await api.get('/tools');
      return response.data;
    },
    getAvailable: async () => {
      const response = await api.get('/tools/available');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/tools/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/tools', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/tools/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/tools/${id}`);
    },
  },

  toolInstances: {
    getAll: async () => {
      const response = await api.get('/tool-instances');
      return response.data;
    },
    getActive: async () => {
      const response = await api.get('/tool-instances/active');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/tool-instances/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/tool-instances', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/tool-instances/${id}`, data);
      return response.data;
    },
    stop: async (id: string) => {
      const response = await api.patch(`/tool-instances/${id}/stop`);
      return response.data;
    },
  },

  orders: {
    getAll: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    },
    getItems: async (orderId: string) => {
      const response = await api.get(`/orders/${orderId}/items`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/orders/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/orders/${id}`);
    },
  },

  inventory: {
    getAll: async () => {
      const response = await api.get('/inventory');
      return response.data;
    },
    getLowStock: async () => {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/inventory', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.patch(`/inventory/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      await api.delete(`/inventory/${id}`);
    },
  },
};
