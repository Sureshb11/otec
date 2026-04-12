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

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string; gradient: string }> = {
  super_admin: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', gradient: 'from-purple-500 to-violet-600' },
  admin:       { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', gradient: 'from-rose-500 to-red-600' },
  manager:     { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
  employee:    { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-600' },
  driver:      { bg: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-violet-600' },
  vendor:      { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', gradient: 'from-orange-500 to-amber-600' },
};
const DEFAULT_COLOR = { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500', gradient: 'from-slate-500 to-slate-600' };

const getRoleColor = (name: string) => ROLE_COLORS[name.toLowerCase()] || DEFAULT_COLOR;

const RoleManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => { const r = await api.get('/users'); return r.data; },
  });

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => { const r = await api.get('/roles'); return r.data; },
  });

  const updateUserRoles = useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: string; roleIds: string[] }) => api.put(`/users/${userId}/roles`, { roleIds }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowRoleModal(false); setSelectedUser(null); },
  });

  const handleAssignRole = (user: User) => { setSelectedUser(user); setShowRoleModal(true); };

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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">Loading roles & users...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Role Assignment</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium dark:text-slate-400">Assign and manage user roles across your organization</p>
        </div>
        <button
          onClick={() => navigate('/roles')}
          className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl text-sm font-bold hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Manage Roles
        </button>
      </div>

      <div className="space-y-6 animate-fade-in-up">

        {/* ── Users List ── */}
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/60 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">All Users</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{users?.length || 0} total</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100/60 dark:divide-white/5">
            {users?.map((user) => {
              const isYou = user.id === currentUser?.id;
              return (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-meta-4/30 transition-colors group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white font-bold text-sm">{user.firstName[0]}{user.lastName[0]}</span>
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.firstName} {user.lastName}</span>
                        {isYou && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{user.email}</p>
                    </div>

                    {/* Role badges */}
                    <div className="flex items-center gap-1.5 ml-auto mr-4 flex-shrink-0">
                      {user.roles?.map((role) => {
                        const c = getRoleColor(role.name);
                        return (
                          <span key={role.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${c.bg} ${c.text} border border-current/10`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                            {role.name.replace(/_/g, ' ')}
                          </span>
                        );
                      })}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className="text-[10px] font-bold text-slate-400 italic">No roles</span>
                      )}
                    </div>
                  </div>

                  {/* Manage button */}
                  <button
                    onClick={() => handleAssignRole(user)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-meta-4 hover:border-slate-300 dark:hover:border-white/20 transition-all opacity-60 group-hover:opacity-100 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Roles Overview ── */}
        <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/60 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">Available Roles</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{roles?.length || 0} roles defined</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/roles')}
              className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Create / Edit
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles?.map((role) => {
                const usersWithRole = users?.filter(u => u.roles.some(r => r.id === role.id)).length || 0;
                const c = getRoleColor(role.name);
                return (
                  <div key={role.id} className="relative p-5 rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-boxdark/60 hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden">
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />

                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {role.name.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span className="text-lg font-black text-slate-800 dark:text-white">{usersWithRole}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {role.description || 'No description provided'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Role Assignment Modal ── */}
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
                const c = getRoleColor(role.name);
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
                          hasRole ? `${c.bg} ${c.text}` : 'bg-slate-100 dark:bg-meta-4 text-slate-400 dark:text-slate-500'
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
    </div>
  );
};

export default RoleManagement;
