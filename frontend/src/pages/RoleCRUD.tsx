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

  const getRoleStyle = (roleName: string) => {
    const styles: Record<string, { bg: string; icon: string; text: string; border: string }> = {
      admin: { bg: 'bg-red-50', icon: '🛡️', text: 'text-red-700', border: 'border-red-200' },
      manager: { bg: 'bg-blue-50', icon: '👔', text: 'text-blue-700', border: 'border-blue-200' },
      employee: { bg: 'bg-green-50', icon: '👷', text: 'text-green-700', border: 'border-green-200' },
      driver: { bg: 'bg-purple-50', icon: '🚚', text: 'text-purple-700', border: 'border-purple-200' },
      vendor: { bg: 'bg-orange-50', icon: '🏪', text: 'text-orange-700', border: 'border-orange-200' },
      user: { bg: 'bg-gray-50', icon: '👤', text: 'text-gray-700', border: 'border-gray-200' },
    };
    return styles[roleName.toLowerCase()] || styles['user'];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Roles & Permissions</h1>
          <p className="mt-2 text-gray-500 font-medium">Manage access levels and permissions for your team.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-red-600 font-semibold">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create New Role Card */}
        <button
          onClick={() => {
            setShowCreateModal(true);
            resetCreate();
            setError(null);
          }}
          className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50/50 transition-all duration-300 min-h-[320px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center mb-4 transition-colors duration-300">
            <svg className="w-8 h-8 text-gray-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">Create New Role</h3>
          <p className="text-sm text-gray-500 text-center mt-2 group-hover:text-primary-600/70">Define a new role and its permissions</p>
        </button>

        {roles?.map((role) => {
          const style = getRoleStyle(role.name);
          return (
            <div
              key={role.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1 relative"
            >
              <div className={`absolute top-0 inset-x-0 h-1.5 ${style.text.replace('text', 'bg').replace('700', '500')}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center text-3xl shadow-inner`}>
                    {style.icon}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit Description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {role.name !== 'admin' && role.name !== 'user' && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">{role.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-6">{role.description || 'No description provided.'}</p>

                <button
                  onClick={() => navigate(`/roles/${role.id}/permissions`)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${style.border} ${style.bg} ${style.text} hover:scale-[1.02] active:scale-[0.98] mt-auto flex items-center justify-center space-x-2`}
                >
                  <span>Manage Permissions</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden animate-slideUp">
            <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Create New Role</h3>
              <p className="text-sm text-gray-500 mt-1">Define properties for the new role</p>
            </div>

            <form onSubmit={handleCreateSubmit(handleCreate)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...registerCreate('name', {
                    required: 'Role name is required',
                    minLength: { value: 2, message: 'Minimum 2 characters' },
                    pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Alphanumeric, underscores & hyphens only' }
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                  placeholder="e.g. supervisor"
                />
                {createErrors.name && <p className="mt-1.5 text-sm text-red-600 font-medium">{createErrors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  {...registerCreate('description')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-gray-50/50 focus:bg-white resize-none"
                  placeholder="Describe the responsibilities of this role..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full relative z-10 overflow-hidden animate-slideUp">
            <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">Edit Role</h3>
              <p className="text-sm text-gray-500 mt-1">Update description for {editingRole.name}</p>
            </div>

            <form onSubmit={handleUpdateSubmit(handleUpdate)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role Name</label>
                <input
                  type="text"
                  value={editingRole.name}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                />
                <p className="mt-1.5 text-xs text-gray-400">Role names cannot be changed after creation.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  {...registerUpdate('description')}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 bg-gray-50/50 focus:bg-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all"
                >
                  {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
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
