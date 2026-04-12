import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PermissionFlags {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
  /** Merged permission matrix across all user roles. Key = module key (lowercase). Empty for admin (admin bypasses checks). */
  permissions: Record<string, PermissionFlags>;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Use unified API client which handles mock/real API switching
    return apiClient.auth.login(credentials);
  },

  // register: async (data: RegisterData): Promise<AuthResponse> => {
  //   const response = await api.post<AuthResponse>('/auth/register', data);
  //   return response.data;
  // },
};
