import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/apiClient';
import api from '../api/axios';

interface EditUserData {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleIds?: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const RoleIcon = ({ role, className = 'w-5 h-5' }: { role: string; className?: string }) => {
  switch (role.toLowerCase()) {
    case 'admin': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'manager': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'employee': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'driver': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h4m4.5 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm-10 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM3 11V6a2 2 0 012-2h6l3 3h5a2 2 0 012 2v2" /></svg>;
    case 'vendor': return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    default: return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  }
};

const getRoleColor = (roleName: string) => {
  switch (roleName.toLowerCase()) {
    case 'admin': return 'bg-red-50 text-red-700 border-red-200 peer-checked:bg-red-100 peer-checked:border-red-400 dark:bg-boxdark dark:text-red-400 dark:border-strokedark dark:peer-checked:bg-red-900/30 dark:peer-checked:border-red-500';
    case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200 peer-checked:bg-blue-100 peer-checked:border-blue-400 dark:bg-boxdark dark:text-blue-400 dark:border-strokedark dark:peer-checked:bg-blue-900/30 dark:peer-checked:border-blue-500';
    case 'employee': return 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100 peer-checked:border-green-400 dark:bg-boxdark dark:text-green-400 dark:border-strokedark dark:peer-checked:bg-green-900/30 dark:peer-checked:border-green-500';
    case 'driver': return 'bg-purple-50 text-purple-700 border-purple-200 peer-checked:bg-purple-100 peer-checked:border-purple-400 dark:bg-boxdark dark:text-purple-400 dark:border-strokedark dark:peer-checked:bg-purple-900/30 dark:peer-checked:border-purple-500';
    case 'vendor': return 'bg-orange-50 text-orange-700 border-orange-200 peer-checked:bg-orange-100 peer-checked:border-orange-400 dark:bg-boxdark dark:text-orange-400 dark:border-strokedark dark:peer-checked:bg-orange-900/30 dark:peer-checked:border-orange-500';
    default: return 'bg-gray-50 text-gray-700 border-gray-200 peer-checked:bg-gray-100 peer-checked:border-gray-400 dark:bg-boxdark dark:text-bodydark2 dark:border-strokedark dark:peer-checked:bg-meta-4 dark:peer-checked:border-strokedark';
  }
};

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [changePassword, setChangePassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditUserData>();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.users.getById(id!),
    enabled: !!id,
  });

  // Fetch available roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      if (user.roles) {
        setSelectedRoles(user.roles.map((r: any) => r.id));
      }
    }
  }, [user, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: EditUserData) => {
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };
      if (changePassword && data.password) {
        payload.password = data.password;
      }
      // Update user details
      await apiClient.users.update(id!, payload);
      // Update roles
      if (selectedRoles.length > 0) {
        await api.put(`/users/${id}/roles`, { roleIds: selectedRoles });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setSuccess(true);
      setError(null);
      setTimeout(() => navigate('/users'), 1500);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update user. Please try again.');
      setSuccess(false);
    },
  });

  const onSubmit = (data: EditUserData) => {
    if (selectedRoles.length === 0) {
      setError('Please select a role for this user.');
      return;
    }
    setError(null);
    mutation.mutate(data);
  };

  if (userLoading || rolesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">User not found</p>
        <Link to="/users" className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">Back to Users</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
            Edit User
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Update details for <span className="font-bold text-slate-700 dark:text-white">{user.firstName} {user.lastName}</span>
          </p>
        </div>
        <Link
          to="/users"
          className="flex items-center px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-boxdark border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-meta-4 transition-all shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Users
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Success alert */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">User updated successfully! Redirecting...</span>
            </div>
          )}

          {/* Error alert */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-sm text-rose-700 dark:text-rose-400 font-bold">{error}</span>
            </div>
          )}

          {/* Personal Info Card */}
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl p-8 border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-500/5 rounded-full -mr-32 -mt-32 opacity-50" />

            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center relative z-10">
              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {[
                { id: 'firstName', label: 'First Name', type: 'text' },
                { id: 'lastName', label: 'Last Name', type: 'text' },
                { id: 'email', label: 'Email Address', type: 'email' },
              ].map((field) => (
                <div key={field.id} className={field.id === 'email' ? 'md:col-span-2' : ''}>
                  <label htmlFor={field.id} className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    {field.label} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register(field.id as keyof EditUserData, {
                      required: `${field.label} is required`,
                      ...(field.id === 'email' ? {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        }
                      } : {}),
                    })}
                    type={field.type}
                    onFocus={() => setFocusedField(field.id)}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/60 dark:bg-boxdark text-slate-800 dark:text-white text-sm font-medium ${
                      errors[field.id as keyof EditUserData]
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : focusedField === field.id
                          ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-500/20'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-blue-200'
                    } focus:outline-none`}
                  />
                  {errors[field.id as keyof EditUserData] && (
                    <p className="mt-1.5 text-xs text-rose-500 font-bold flex items-center ml-1">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {errors[field.id as keyof EditUserData]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Change Password Toggle */}
            <div className="mt-6 pt-6 border-t border-slate-100/60 dark:border-white/5 relative z-10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => setChangePassword(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                  Change password
                </span>
              </label>

              {changePassword && (
                <div className="mt-4 max-w-md">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('password', {
                      ...(changePassword ? {
                        required: 'Password is required when changing',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      } : {}),
                    })}
                    type="password"
                    placeholder="Min 6 characters"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/60 dark:bg-boxdark text-slate-800 dark:text-white text-sm font-medium ${
                      errors.password
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : focusedField === 'password'
                          ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-500/20'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500 focus:ring-blue-200'
                    } focus:outline-none`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-rose-500 font-bold flex items-center ml-1">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {errors.password?.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Role Selection Card */}
          <div className="glass-premium dark:bg-boxdark/90 rounded-2xl p-8 border border-white/20 dark:border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-500/5 rounded-full -mr-32 -mt-32 opacity-50" />

            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center relative z-10">
              <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-3">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              Assign Role
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {roles?.map((role) => (
                <label
                  key={role.id}
                  className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${getRoleColor(role.name)}`}
                >
                  <input
                    type="radio"
                    name="userRole"
                    className="peer sr-only"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => setSelectedRoles([role.id])}
                  />
                  <div className="absolute top-4 right-4 opacity-30">
                    <RoleIcon role={role.name} className="w-7 h-7" />
                  </div>
                  <div className="flex items-center mb-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      selectedRoles.includes(role.id) ? 'border-current bg-current' : 'border-gray-300 dark:border-strokedark bg-white dark:bg-boxdark'
                    }`}>
                      {selectedRoles.includes(role.id) && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-bold capitalize text-lg tracking-tight">
                      {role.name}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 pl-8 leading-relaxed">
                    {role.description || 'No description available'}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-boxdark border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-meta-4 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading || success}
              className={`px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 ${
                (mutation.isLoading || success) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {mutation.isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : success ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Saved!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
