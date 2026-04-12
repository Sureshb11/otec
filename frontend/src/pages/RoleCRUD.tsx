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
      super_admin: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: '⚡', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      admin: { bg: 'bg-red-50 dark:bg-red-900/30', icon: '🛡️', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
      manager: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: '👔', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
      employee: { bg: 'bg-green-50 dark:bg-green-900/30', icon: '👷', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
      driver: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: '🚚', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
      vendor: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: '🏪', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
      user: { bg: 'bg-gray-50 dark:bg-gray-700/30', icon: '👤', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600' },
    };
    return styles[roleName.toLowerCase()] || styles['user'];
  };

  /** Protected roles that cannot be deleted. */
  const isProtectedRole = (name: string) => ['super_admin', 'admin', 'user'].includes(name.toLowerCase());

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-slate-500 dark:text-bodydark2">Manage access levels and permissions for your team.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm font-semibold">{error}</div>
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
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-strokedark hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-meta-4 transition-all duration-200 min-h-[250px] group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-black group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 flex items-center justify-center mb-4 transition-colors">
            <svg className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400">Create New Role</h3>
          <p className="text-sm text-slate-500 dark:text-bodydark2 text-center mt-1">Define properties for a new role</p>
        </button>

        {roles?.map((role) => {
          const style = getRoleStyle(role.name);
          return (
            <div
              key={role.id}
              className="bg-white dark:bg-boxdark rounded-xl border border-slate-200 dark:border-strokedark shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center text-2xl`}>
                    {style.icon}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-meta-4 rounded transition-colors"
                      title="Edit Description"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {!isProtectedRole(role.name) && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-meta-4 rounded transition-colors"
                        title="Delete Role"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize">{role.name.replace(/_/g, ' ')}</h3>
                  {role.name === 'super_admin' && (
                    <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Full Access</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-bodydark2 line-clamp-3 mb-6">
                  {role.description || 'No description provided for this role.'}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-strokedark">
                  <button
                    onClick={() => navigate(`/roles/${role.id}/permissions`)}
                    className="w-full py-2 rounded-lg font-medium text-sm border border-slate-200 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-slate-600 dark:text-bodydark1 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Manage Permissions</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />
          <div className="bg-white dark:bg-boxdark rounded-xl shadow-xl max-w-md w-full relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-strokedark bg-slate-50 dark:bg-meta-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Role</h3>
            </div>

            <form onSubmit={handleCreateSubmit(handleCreate)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-bodydark2 uppercase tracking-widest mb-1">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...registerCreate('name', {
                    required: 'Role name is required',
                    minLength: { value: 2, message: 'Minimum 2 characters' },
                    pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Alphanumeric, underscores & hyphens only' }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-strokedark bg-transparent dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
                  placeholder="e.g. supervisor"
                />
                {createErrors.name && <p className="mt-1 text-xs text-red-600 font-medium">{createErrors.name?.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-bodydark2 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  {...registerCreate('description')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-strokedark bg-transparent dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors resize-none"
                  placeholder="Describe the responsibilities..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-bodydark1 bg-white dark:bg-boxdark border border-slate-300 dark:border-strokedark rounded-lg hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  {createMutation.isLoading ? 'CREATING...' : 'CREATE ROLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-boxdark rounded-xl shadow-xl max-w-md w-full relative z-10 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-strokedark bg-slate-50 dark:bg-meta-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Role</h3>
              <p className="text-xs text-slate-500 dark:text-bodydark2 mt-0.5">Editing <span className="font-bold">{editingRole?.name}</span></p>
            </div>

            <form onSubmit={handleUpdateSubmit(handleUpdate)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-bodydark2 uppercase tracking-widest mb-1">Role Name</label>
                <input
                  type="text"
                  value={editingRole?.name}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-strokedark bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-bodydark1 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-bodydark2 uppercase tracking-widest mb-1">Description</label>
                <textarea
                  {...registerUpdate('description')}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-strokedark bg-transparent dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-bodydark1 bg-white dark:bg-boxdark border border-slate-300 dark:border-strokedark rounded-lg hover:bg-slate-50 dark:hover:bg-meta-4 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isLoading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  {updateMutation.isLoading ? 'SAVING...' : 'SAVE CHANGES'}
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
