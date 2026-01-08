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
          <h1 className="text-3xl font-bold text-gray-900">User Role Assignment</h1>
          <p className="mt-2 text-sm text-gray-600">Assign roles to users (Admin Only)</p>
        </div>
        <button
          onClick={() => navigate('/roles')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Manage Roles
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
        </div>
        <ul className="divide-y divide-gray-200">
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
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.id === currentUser?.id && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        {user.roles?.map((role) => (
                          <span
                            key={role.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              role.name === 'admin'
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
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Roles for {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <div className="space-y-3">
                {roles?.map((role) => {
                  const hasRole = selectedUser.roles.some(r => r.id === role.id);
                  return (
                    <label
                      key={role.id}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={hasRole}
                        onChange={() => handleRoleToggle(role.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        disabled={updateUserRoles.isLoading}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {role.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              role.name === 'admin'
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
                            {hasRole ? 'Assigned' : 'Not Assigned'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {updateUserRoles.isLoading && (
                  <span className="text-sm text-gray-500">Saving...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roles Overview with CRUD */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
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
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        role.name === 'admin'
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
                    <span className="text-sm font-medium text-gray-900">
                      {usersWithRole} user{usersWithRole !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
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

