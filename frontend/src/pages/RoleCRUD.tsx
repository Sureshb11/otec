import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface CreateRoleData {
  name: string;
  description: string;
}

interface UpdateRoleData {
  description: string;
}

const RoleCRUD = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register: registerCreate, handleSubmit: handleCreateSubmit, reset: resetCreate, formState: { errors: createErrors } } = useForm<CreateRoleData>();
  const { register: registerUpdate, handleSubmit: handleUpdateSubmit, reset: resetUpdate } = useForm<UpdateRoleData>();

  // Fetch all roles
  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleData) => {
      const response = await api.post('/roles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowCreateModal(false);
      resetCreate();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create role. Please try again.');
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleData }) => {
      const response = await api.patch(`/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowEditModal(false);
      setEditingRole(null);
      resetUpdate();
      setError(null);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update role. Please try again.');
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to delete role. Please try again.');
    },
  });

  const handleCreate = (data: CreateRoleData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: UpdateRoleData) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    resetUpdate({ description: role.description });
    setShowEditModal(true);
    setError(null);
  };

  const handleDelete = (role: Role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, { bg: string; icon: string }> = {
      admin: { bg: 'bg-orange-100', icon: '🛡️' },
      manager: { bg: 'bg-blue-100', icon: '👔' },
      employee: { bg: 'bg-primary-100', icon: '👤' },
      driver: { bg: 'bg-green-100', icon: '🚗' },
      vendor: { bg: 'bg-yellow-100', icon: '🏪' },
      user: { bg: 'bg-gray-100', icon: '👥' },
    };
    return icons[roleName.toLowerCase()] || { bg: 'bg-gray-100', icon: '👤' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
        <p className="mt-2 text-sm text-gray-600">Overview of all team members and roles.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {roles?.map((role) => {
          const { bg, icon } = getRoleIcon(role.name);
          return (
            <div
              key={role.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative group"
            >
              {/* Icon */}
              <div className={`${bg} w-16 h-16 rounded-lg flex items-center justify-center mb-4 text-3xl`}>
                {icon}
              </div>

              {/* Role Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                {role.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {role.description || 'No description available'}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/roles/${role.id}/permissions`)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Permissions
                </button>
                <button
                  onClick={() => handleEdit(role)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Edit
                </button>
                {role.name !== 'admin' && role.name !== 'user' && (
                  <button
                    onClick={() => handleDelete(role)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Role Card */}
        <div
          onClick={() => {
            setShowCreateModal(true);
            resetCreate();
            setError(null);
          }}
          className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px]"
        >
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4 text-3xl">
            +
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Role</h3>
          <p className="text-sm text-gray-500 text-center">Click to create a new role</p>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Role</h3>
            <form onSubmit={handleCreateSubmit(handleCreate)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name *</label>
                  <select
                    {...registerCreate('name', { required: 'Role name is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select a role</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                    <option value="driver">Driver</option>
                    <option value="vendor">Vendor</option>
                  </select>
                  {createErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{createErrors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...registerCreate('description')}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter role description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreate();
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Role: {editingRole.name}</h3>
            <form onSubmit={handleUpdateSubmit(handleUpdate)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input
                    type="text"
                    value={editingRole.name}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Role name cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...registerUpdate('description')}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter role description"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRole(null);
                    resetUpdate();
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {updateMutation.isLoading ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleCRUD;
