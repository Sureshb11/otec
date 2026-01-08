// Mock API service for UI-first development
// Simulates API calls with delays and returns mock data

import { mockUsers, mockRoles, mockPermissions, mockLoginUsers, MockUser, MockRole, MockPermission } from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock JWT token (just a simple string for mock)
const generateMockToken = (email: string) => {
  return `mock_token_${btoa(email)}_${Date.now()}`;
};

export const mockApi = {
  // Authentication
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      await delay(800); // Simulate network delay
      
      const user = mockLoginUsers[credentials.email];
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      if (user.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      
      const token = generateMockToken(credentials.email);
      
      return {
        access_token: token,
        user: user.user,
      };
    },
  },

  // Users
  users: {
    getAll: async (): Promise<MockUser[]> => {
      await delay(500);
      return [...mockUsers];
    },
    getById: async (id: string): Promise<MockUser | null> => {
      await delay(300);
      return mockUsers.find(u => u.id === id) || null;
    },
    create: async (userData: Partial<MockUser>): Promise<MockUser> => {
      await delay(500);
      const newUser: MockUser = {
        id: String(mockUsers.length + 1),
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        isActive: userData.isActive ?? true,
        roles: userData.roles || [],
      };
      mockUsers.push(newUser);
      return newUser;
    },
    update: async (id: string, userData: Partial<MockUser>): Promise<MockUser> => {
      await delay(500);
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) throw new Error('User not found');
      mockUsers[index] = { ...mockUsers[index], ...userData };
      return mockUsers[index];
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) throw new Error('User not found');
      mockUsers.splice(index, 1);
    },
  },

  // Roles
  roles: {
    getAll: async (): Promise<MockRole[]> => {
      await delay(500);
      return [...mockRoles];
    },
    getById: async (id: string): Promise<MockRole | null> => {
      await delay(300);
      return mockRoles.find(r => r.id === id) || null;
    },
    create: async (roleData: Partial<MockRole>): Promise<MockRole> => {
      await delay(500);
      const newRole: MockRole = {
        id: String(mockRoles.length + 1),
        name: roleData.name || '',
        description: roleData.description || '',
      };
      mockRoles.push(newRole);
      return newRole;
    },
    update: async (id: string, roleData: Partial<MockRole>): Promise<MockRole> => {
      await delay(500);
      const index = mockRoles.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Role not found');
      mockRoles[index] = { ...mockRoles[index], ...roleData };
      return mockRoles[index];
    },
    delete: async (id: string): Promise<void> => {
      await delay(300);
      const index = mockRoles.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Role not found');
      mockRoles.splice(index, 1);
    },
  },

  // Permissions
  permissions: {
    getByRoleId: async (roleId: string): Promise<MockPermission[]> => {
      await delay(500);
      return mockPermissions.filter(p => p.roleId === roleId);
    },
    createDefaults: async (roleId: string): Promise<MockPermission[]> => {
      await delay(500);
      const defaults = mockPermissions.map(p => ({
        ...p,
        id: String(mockPermissions.length + 1),
        roleId,
      }));
      mockPermissions.push(...defaults);
      return defaults;
    },
    bulkUpdate: async (roleId: string, permissions: Partial<MockPermission>[]): Promise<MockPermission[]> => {
      await delay(500);
      // Remove old permissions for this role
      const filtered = mockPermissions.filter(p => p.roleId !== roleId);
      mockPermissions.length = 0;
      mockPermissions.push(...filtered);
      
      // Add new permissions
      const newPerms = permissions.map((p, i) => ({
        id: String(mockPermissions.length + i + 1),
        moduleName: p.moduleName || '',
        feature: p.feature || '',
        canView: p.canView ?? false,
        canAdd: p.canAdd ?? false,
        canEdit: p.canEdit ?? false,
        canDelete: p.canDelete ?? false,
        roleId,
      }));
      mockPermissions.push(...newPerms);
      return newPerms;
    },
  },
};

