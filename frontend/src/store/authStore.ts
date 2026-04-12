import { create } from 'zustand';
import type { PermissionAction } from '../config/permissions';

interface PermissionFlags {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: Record<string, PermissionFlags>;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, permissions?: Record<string, PermissionFlags>) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  /** Check a single permission: can(module, action). Super admin always returns true. */
  can: (module: string, action: PermissionAction) => boolean;
}

const ACTION_TO_FLAG: Record<PermissionAction, keyof PermissionFlags> = {
  view: 'canView',
  add: 'canAdd',
  edit: 'canEdit',
  delete: 'canDelete',
};

// Load from localStorage on initialization
const loadAuthFromStorage = (): { user: User | null; token: string | null; permissions: Record<string, PermissionFlags> } => {
  if (typeof window === 'undefined') return { user: null, token: null, permissions: {} };
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
        permissions: parsed.permissions || {},
      };
    }
  } catch (error) {
    console.error('Error loading auth from storage:', error);
  }
  return { user: null, token: null, permissions: {} };
};

const { user: initialUser, token: initialToken, permissions: initialPermissions } = loadAuthFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  permissions: initialPermissions,
  isAuthenticated: !!(initialUser && initialToken),
  setAuth: (user, token, permissions = {}) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-storage', JSON.stringify({ user, token, permissions }));
    }
    set({
      user,
      token,
      permissions,
      isAuthenticated: true,
    });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
    }
    set({
      user: null,
      token: null,
      permissions: {},
      isAuthenticated: false,
    });
  },
  hasRole: (role: string) => {
    const state = get();
    const userRoles = state.user?.roles;
    if (!userRoles) return false;

    // Handle both string[] and Role[] (object with name property)
    return userRoles.some((r: any) => {
      if (typeof r === 'string') return r === role;
      return r?.name === role;
    });
  },
  isSuperAdmin: () => {
    const state = get();
    const userRoles = state.user?.roles;
    if (!userRoles) return false;
    return userRoles.some((r: any) => {
      if (typeof r === 'string') return r === 'super_admin';
      return r?.name === 'super_admin';
    });
  },
  isAdmin: () => {
    const state = get();
    const userRoles = state.user?.roles;
    if (!userRoles) return false;

    // Handle both string[] and Role[] (object with name property)
    return userRoles.some((r: any) => {
      if (typeof r === 'string') return r === 'admin' || r === 'super_admin';
      return r?.name === 'admin' || r?.name === 'super_admin';
    });
  },
  can: (module: string, action: PermissionAction) => {
    const state = get();
    // Super admin bypasses all permission checks
    if (state.isSuperAdmin()) return true;

    const modPerms = state.permissions[module.toLowerCase()];
    if (!modPerms) {
      // If no permissions configured for this module, fail-open
      // (matches backend behaviour for unconfigured modules)
      return true;
    }
    return !!modPerms[ACTION_TO_FLAG[action]];
  },
}));
