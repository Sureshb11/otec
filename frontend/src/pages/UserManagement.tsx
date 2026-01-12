import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/apiClient';
import type { User } from '../api/apiClient';



const UserManagement = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Always try to fetch users - let the backend decide access
  // The backend will return 403 if user doesn't have admin role
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const authState = useAuthStore.getState();
        console.log('🔍 Fetching users - Token exists:', !!authState.token);
        console.log('🔍 Auth state:', {
          isAuthenticated: authState.isAuthenticated,
          userEmail: authState.user?.email,
          userRoles: authState.user?.roles,
        });
        // Use apiClient which handles mock/real switching automatically
        return await apiClient.users.getAll();
      } catch (err: any) {
        console.error('❌ Error fetching users:', {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          message: err?.message,
        });
        // Re-throw with more context
        throw err;
      }
    },
    retry: false,
    enabled: isAuthenticated, // Only make the request if user is authenticated
  });

  // Filter and search users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filterRole === 'all' || user.roles?.some((role) => role.name === filterRole);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    inactive: users?.filter((u) => !u.isActive).length || 0,
    admins: users?.filter((u) => u.roles?.some((r) => r.name === 'admin')).length || 0,
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: 'bg-red-100', text: 'text-red-800' },
    manager: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    employee: { bg: 'bg-green-100', text: 'text-green-800' },
    driver: { bg: 'bg-primary-100', text: 'text-primary-800' },
    vendor: { bg: 'bg-orange-100', text: 'text-orange-800' },
    user: { bg: 'bg-blue-100', text: 'text-blue-800' },
  };

  const getRoleColor = (roleName: string) => {
    return roleColors[roleName] || roleColors.user;
  };

  // Check if user is authenticated and is admin before loading
  if (!isAuthenticated) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-red-800 font-semibold text-lg">Authentication Required</div>
              <div className="text-red-700 text-sm mt-2">
                You need to be logged in to access this page.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <div className="text-gray-600 font-medium">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorStatus = (error as any)?.response?.status;
    const errorData = (error as any)?.response?.data;

    // Log full error details for debugging
    console.error('UserManagement Error:', {
      status: errorStatus,
      errorData,
      fullError: error,
    });

    const errorMessage =
      errorData?.message ||
        errorData?.error ||
        errorStatus === 403
        ? 'Access denied. You need admin privileges to view this page.'
        : errorStatus === 401
          ? 'Authentication required. Please log in again.'
          : 'Error loading users. Please try again later.';

    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-red-800 font-semibold text-lg">Error loading users</div>
              <div className="text-red-600 text-sm mt-2">{errorMessage}</div>
              {errorStatus === 403 && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg space-y-2">
                  <p className="text-sm text-red-800">
                    <strong>Note:</strong> This page requires administrator access.
                  </p>
                  <div className="text-xs text-red-700 mt-2">
                    <p><strong>Your current roles:</strong> {user?.roles?.map((r: any) => typeof r === 'string' ? r : r.name).join(', ') || 'None'}</p>
                    <p className="mt-1"><strong>Your email:</strong> {user?.email || 'Not available'}</p>
                  </div>
                  <p className="text-sm text-red-800 mt-3">
                    <strong>Solution:</strong> If you recently received admin access, please log out and log back in to refresh your authentication token.
                  </p>
                </div>
              )}
              {errorStatus === 401 && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg space-y-2">
                  <p className="text-sm text-red-800">
                    <strong>Authentication Error:</strong> Your session has expired or your token is invalid.
                  </p>
                  <p className="text-xs text-red-700">
                    <strong>Error Details:</strong> {errorData?.message || errorData?.error || 'Token validation failed'}
                  </p>
                  {errorData && (
                    <details className="text-xs text-gray-600 mt-2">
                      <summary className="cursor-pointer text-red-700 font-medium">Show full error details</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(errorData, null, 2)}
                      </pre>
                    </details>
                  )}
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>Common causes:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Your token has expired (tokens expire after 24 hours)</li>
                      <li>The backend server was restarted with a different JWT_SECRET</li>
                      <li>Your user account no longer exists in the database</li>
                    </ul>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        useAuthStore.getState().logout();
                        window.location.href = '/login';
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Log Out and Sign In Again
                    </button>
                    <button
                      onClick={() => {
                        const authState = useAuthStore.getState();
                        const token = authState.token;
                        if (token) {
                          try {
                            // Decode JWT token (without verification)
                            const base64Url = token.split('.')[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const jsonPayload = decodeURIComponent(
                              atob(base64)
                                .split('')
                                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                .join('')
                            );
                            const payload = JSON.parse(jsonPayload);
                            alert(`Token Info:\n\nUser ID: ${payload.sub}\nEmail: ${payload.email}\nExpires: ${new Date(payload.exp * 1000).toLocaleString()}\nCurrent Time: ${new Date().toLocaleString()}\n\nToken is ${payload.exp * 1000 > Date.now() ? 'VALID' : 'EXPIRED'}`);
                          } catch (e) {
                            alert('Could not decode token: ' + e);
                          }
                        } else {
                          alert('No token found');
                        }
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Debug Token
                    </button>
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    <strong>Note:</strong> After logging back in, you should have access to this page if you have admin privileges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent">User Management</h1>
            <p className="mt-2 text-sm text-gray-600">Manage all users in the system (Admin Only)</p>
          </div>
          <button
            onClick={() => navigate('/users/create')}
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="md:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
              <option value="vendor">Vendor</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers && filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-xl">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {user.isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Active
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles?.map((role) => {
                    const colors = getRoleColor(role.name);
                    return (
                      <span
                        key={role.name}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        {role.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                      // TODO: Implement delete functionality
                      console.log('Delete user:', user.id);
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="text-gray-500 font-medium text-lg">No users found</p>
          <p className="text-gray-400 text-sm mt-2">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating a new user'}
          </p>
        </div>
      )}

      {/* Results Count */}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className="mt-6 text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {stats.total} users
        </div>
      )}
    </div>
  );
};

export default UserManagement;
