// Mock data for UI-first development
// This allows us to build and test UI without backend

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Array<{ id: string; name: string }>;
}

export interface MockRole {
  id: string;
  name: string;
  description: string;
}

export interface MockPermission {
  id: string;
  moduleName: string;
  feature: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  roleId: string;
}

// Mock Users (for user management)
export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@otec.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    roles: [{ id: '1', name: 'admin' }],
  },
  {
    id: '2',
    email: 'manager@otec.com',
    firstName: 'John',
    lastName: 'Manager',
    isActive: true,
    roles: [{ id: '2', name: 'manager' }],
  },
  {
    id: '3',
    email: 'employee@otec.com',
    firstName: 'Jane',
    lastName: 'Employee',
    isActive: true,
    roles: [{ id: '3', name: 'employee' }],
  },
];

// Mock Users for Login (with passwords)
export interface MockLoginUser {
  email: string;
  password: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export const mockLoginUsers: Record<string, MockLoginUser> = {
  'admin@otec.com': {
    email: 'admin@otec.com',
    password: 'Admin@123', // Updated to match real admin password
    user: {
      id: '1',
      email: 'admin@otec.com',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
    },
  },
  'manager@otec.com': {
    email: 'manager@otec.com',
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@otec.com',
      firstName: 'John',
      lastName: 'Manager',
      roles: ['manager'],
    },
  },
  'employee@otec.com': {
    email: 'employee@otec.com',
    password: 'employee123',
    user: {
      id: '3',
      email: 'employee@otec.com',
      firstName: 'Jane',
      lastName: 'Employee',
      roles: ['employee'],
    },
  },
  'user@otec.com': {
    email: 'user@otec.com',
    password: 'user123',
    user: {
      id: '4',
      email: 'user@otec.com',
      firstName: 'Regular',
      lastName: 'User',
      roles: ['user'],
    },
  },
};

// Mock Roles
export const mockRoles: MockRole[] = [
  {
    id: '1',
    name: 'admin',
    description: 'Administrator with full access',
  },
  {
    id: '2',
    name: 'manager',
    description: 'Manager with elevated permissions',
  },
  {
    id: '3',
    name: 'employee',
    description: 'Employee with standard access',
  },
  {
    id: '4',
    name: 'driver',
    description: 'Driver with delivery/transport access',
  },
  {
    id: '5',
    name: 'vendor',
    description: 'Vendor with supplier access',
  },
];

// Mock Permissions
export const mockPermissions: MockPermission[] = [
  {
    id: '1',
    moduleName: 'Dashboard',
    feature: 'Customise Dashboard',
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    roleId: '1',
  },
  {
    id: '2',
    moduleName: 'Insights',
    feature: 'Report download',
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    roleId: '1',
  },
  {
    id: '3',
    moduleName: 'Opportunities',
    feature: 'Add to another job',
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    roleId: '1',
  },
];

