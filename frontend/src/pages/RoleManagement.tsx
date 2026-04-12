import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Array<{ id: string; name: string }>;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const RoleManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  // Update user roles mutation
  const updateUserRoles = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => {
      return api.put(`/users/${userId}/roles`, { roleIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRoleModal(false);
      setSelectedUser(null);
    },
  });

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleRoleToggle = (roleId: string) => {
    if (!selectedUser) return;

    const currentRoleIds = selectedUser.roles.map(r => r.id);
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter(id => id !== roleId)
      : [...currentRoleIds, roleId];

    updateUserRoles.mutate({ userId: selectedUser.id, roleIds: newRoleIds });
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent dark:text-white dark:bg-none">User Role Assignment</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-bodydark2">Assign roles to users (Admin Only)</p>
        </div>
        <button
          onClick={() => navigate('/roles')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Manage Roles
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-boxdark shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-strokedark">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Users</h3>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-strokedark">
          {users?.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.id === currentUser?.id && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-bodydark2">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        {user.roles?.map((role) => (
                          <span
                            key={role.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${role.name === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : role.name === 'manager'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleAssignRole(user)}
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-strokedark shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-bodydark1 bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-meta-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Manage Roles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} />
          <div className="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 dark:border-white/5">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Manage Roles</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
              </div>
              <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {roles?.map((role) => {
                const hasRole = selectedUser.roles.some(r => r.id === role.id);
                const roleColors: Record<string, { bg: string; text: string }> = {
                  super_admin: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400' },
                  admin: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400' },
                  manager: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
                  employee: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
                  driver: { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400' },
                  vendor: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
                  user: { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400' },
                };
                const colors = roleColors[role.name.toLowerCase()] || roleColors.user;
                return (
                  <label
                    key={role.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      hasRole
                        ? 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 dark:border-blue-500/20'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-meta-4'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={hasRole}
                      onChange={() => handleRoleToggle(role.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      disabled={updateUserRoles.isLoading}
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800 dark:text-white capitalize">
                          {role.name.replace(/_/g, ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          hasRole ? `${colors.bg} ${colors.text}` : 'bg-slate-100 dark:bg-meta-4 text-slate-400 dark:text-slate-500'
                        }`}>
                          {hasRole ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </div>
                      {role.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{role.description}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              {updateUserRoles.isLoading && (
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              )}
              <button
                onClick={() => { setShowRoleModal(false); setSelectedUser(null); }}
                className="ml-auto px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles Overview with CRUD */}
      <div className="bg-white dark:bg-boxdark shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-strokedark flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Available Roles
          </h3>
          <button
            onClick={() => navigate('/roles')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md transition-all duration-200"
          >
            Manage Roles (Create/Edit)
          </button>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {roles?.map((role) => {
              const usersWithRole = users?.filter(u =>
                u.roles.some(r => r.id === role.id)
              ).length || 0;
              return (
                <div key={role.id} className="border border-gray-200 dark:border-strokedark rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${role.name === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : role.name === 'manager'
                          ? 'bg-yellow-100 text-yellow-800'
                          : role.name === 'employee'
                            ? 'bg-green-100 text-green-800'
                            : role.name === 'driver'
                              ? 'bg-primary-100 text-primary-800'
                              : role.name === 'vendor'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {role.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {usersWithRole} user{usersWithRole !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-bodydark2">{role.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;

