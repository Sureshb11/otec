import { create } from 'zustand';

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
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

// Load from localStorage on initialization
const loadAuthFromStorage = (): { user: User | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user || null,
        token: parsed.token || null,
      };
    }
  } catch (error) {
    console.error('Error loading auth from storage:', error);
  }
  return { user: null, token: null };
};

const { user: initialUser, token: initialToken } = loadAuthFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!(initialUser && initialToken),
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
    }
    set({
      user,
      token,
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
      isAuthenticated: false,
    });
  },
  hasRole: (role: string) => {
    const state = get();
    return state.user?.roles?.includes(role) || false;
  },
  isAdmin: () => {
    const state = get();
    return state.user?.roles?.includes('admin') || false;
  },
}));

