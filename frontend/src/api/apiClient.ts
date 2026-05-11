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

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const apiClient = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
      const response = await api.post('/auth/change-password', payload);
      return response.data;
    },
  },

  audit: {
    list: async (params: { limit?: number; offset?: number; action?: string; resource?: string } = {}) => {
      const response = await api.get<{ items: AuditLogEntry[]; total: number }>('/audit-logs', { params });
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
    syncModules: async (roleId: string) => {
      const response = await api.post(`/permissions/role/${roleId}/sync-modules`);
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
    updateStatus: async (id: string, status: string) => {
      const response = await api.patch(`/orders/${id}/status`, { status });
      return response.data;
    },
    // Confirm arrival at rig (Kanban In-Transit → Onsite/Standby).
    // Flips each tool from IN_TRANSIT → ONSITE with rig attached.
    markReachedOnsite: async (id: string) => {
      const response = await api.patch(`/orders/${id}/reached-onsite`);
      return response.data;
    },
    // Operational-runtime timer controls (Kanban Active/Standby).
    // Separate from order status — the order stays 'active' while the
    // operator cycles between Start and Stop.
    startOperation: async (id: string) => {
      const response = await api.patch(`/orders/${id}/operation/start`);
      return response.data;
    },
    stopOperation: async (id: string) => {
      const response = await api.patch(`/orders/${id}/operation/stop`);
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
