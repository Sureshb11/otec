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

  const getRoleName = (r: string | { id: string; name: string }): string =>
    typeof r === 'string' ? r : r.name;

  // Filter and search users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      filterRole === 'all' || user.roles?.some((role) => getRoleName(role) === filterRole);

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
    admins: users?.filter((u) => u.roles?.some((r) => getRoleName(r) === 'admin')).length || 0,
  };

  const roleColors: Record<string, { bg: string; text: string }> = {
    admin: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400' },
    manager: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
    employee: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
    driver: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
    vendor: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
    user: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
  };

  const getRoleColor = (roleName: string) => {
    return roleColors[roleName] || roleColors.user;
  };

  // Check if user is authenticated and is admin before loading
  if (!isAuthenticated) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto mt-8">
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
              <div className="text-red-800 dark:text-red-300 font-semibold text-lg">Authentication Required</div>
              <div className="text-red-700 dark:text-red-200 text-sm mt-2">
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto mt-8">
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
              <div className="text-red-800 dark:text-red-300 font-semibold text-lg">Error loading users</div>
              <div className="text-red-600 dark:text-red-200 text-sm mt-2">{errorMessage}</div>
              {errorStatus === 403 && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg space-y-2">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Note:</strong> This page requires administrator access.
                  </p>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-2">
                    <p><strong>Your current roles:</strong> {user?.roles?.map((r: any) => typeof r === 'string' ? r : r.name).join(', ') || 'None'}</p>
                    <p className="mt-1"><strong>Your email:</strong> {user?.email || 'Not available'}</p>
                  </div>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-3">
                    <strong>Solution:</strong> If you recently received admin access, please log out and log back in to refresh your authentication token.
                  </p>
                </div>
              )}
              {errorStatus === 401 && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg space-y-2">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Authentication Error:</strong> Your session has expired or your token is invalid.
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
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
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Manage all users in the system (Admin Only)</p>
          </div>
          <button
            onClick={() => navigate('/users/create')}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(25,86,168,0.3)] hover:shadow-[0_0_25px_rgba(25,86,168,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
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
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Users</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inactive Users</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Administrators</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl p-5 border border-white/20 dark:border-white/5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm bg-white/50 dark:bg-boxdark dark:text-white transition-all" />
            </div>
          </div>
          <div className="md:w-48">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="block w-full px-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm bg-white/50 dark:bg-boxdark dark:text-white transition-all">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="driver">Driver</option>
              <option value="vendor">Vendor</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="md:w-40">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="block w-full px-4 py-2.5 border border-slate-200 dark:border-strokedark rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm bg-white/50 dark:bg-boxdark dark:text-white transition-all">
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
              className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_4px_15px_rgba(25,86,168,0.3)]">
                      <span className="text-white font-black text-xl">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${user.isActive
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-500/20'
                    }`}
                >
                  {user.isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                      Active
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-1.5"></span>
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.15em]">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {user.roles?.map((role) => {
                    const roleName = getRoleName(role);
                    const colors = getRoleColor(roleName);
                    return (
                      <span
                        key={roleName}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border border-white/10`}
                      >
                        {roleName}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100/50 dark:border-white/5">
                <button
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center space-x-1"
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
                  className="text-sm text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center space-x-1"
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
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <p className="text-slate-500 font-bold text-lg">No users found</p>
          <p className="text-slate-400 text-sm mt-2">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating a new user'}
          </p>
        </div>
      )}

      {/* Results Count */}
      {filteredUsers && filteredUsers.length > 0 && (
        <div className="mt-6 text-sm text-slate-400 dark:text-slate-500 text-center font-medium">
          Showing {filteredUsers.length} of {stats.total} users
        </div>
      )}
    </div>
  );
};

export default UserManagement;
