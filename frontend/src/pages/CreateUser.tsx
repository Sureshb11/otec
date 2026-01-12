import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const CreateUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserData>();

  // Fetch available roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await api.post('/users', {
        ...data,
        roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create user. Please try again.');
    },
  });

  const onSubmit = (data: CreateUserData) => {
    if (selectedRoles.length === 0) {
      setError('Please select a role for this user.');
      return;
    }
    setError(null);
    mutation.mutate(data);
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200 peer-checked:bg-red-100 peer-checked:border-red-400';
      case 'manager': return 'bg-blue-50 text-blue-700 border-blue-200 peer-checked:bg-blue-100 peer-checked:border-blue-400';
      case 'employee': return 'bg-green-50 text-green-700 border-green-200 peer-checked:bg-green-100 peer-checked:border-green-400';
      case 'driver': return 'bg-purple-50 text-purple-700 border-purple-200 peer-checked:bg-purple-100 peer-checked:border-purple-400';
      case 'vendor': return 'bg-orange-50 text-orange-700 border-orange-200 peer-checked:bg-orange-100 peer-checked:border-orange-400';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 peer-checked:bg-gray-100 peer-checked:border-gray-400';
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin': return '🛡️';
      case 'manager': return '👔';
      case 'employee': return '👷';
      case 'driver': return '🚚';
      case 'vendor': return '🏪';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Create User
          </h1>
          <p className="mt-1 text-gray-500">Add a new user to the organization</p>
        </div>
        <Link
          to="/users"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Users
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start space-x-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 text-sm text-red-600 font-medium">{error}</div>
            </div>
          )}

          {/* User Details Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-full -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'firstName', label: 'First Name', type: 'text' },
                { id: 'lastName', label: 'Last Name', type: 'text' },
                { id: 'email', label: 'Email Address', type: 'email' },
                { id: 'password', label: 'Password', type: 'password' },
              ].map((field) => (
                <div key={field.id} className="relative">
                  <label htmlFor={field.id} className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register(field.id as keyof CreateUserData, {
                        required: `${field.label} is required`,
                        ...(field.id === 'email' ? {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          }
                        } : {}),
                        ...(field.id === 'password' ? {
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                          }
                        } : {})
                      })}
                      type={field.type}
                      onFocus={() => setFocusedField(field.id)}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-gray-50/50 ${errors[field.id as keyof CreateUserData]
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : focusedField === field.id
                            ? 'border-primary-500 ring-4 ring-primary-100 bg-white'
                            : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-primary-200'
                        } focus:outline-none`}
                    />
                    {focusedField === field.id && !errors[field.id as keyof CreateUserData] && (
                      <div className="absolute right-3 top-3.5 text-primary-500 animate-fadeIn">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors[field.id as keyof CreateUserData] && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center ml-1 animate-fadeIn">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors[field.id as keyof CreateUserData]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Role Selection Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-50 to-transparent rounded-full -mr-32 -mt-32 opacity-50" />

            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              Assign Role
            </h3>

            {isLoadingRoles ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="absolute top-4 right-4 text-2xl opacity-50">
                      {getRoleIcon(role.name)}
                    </div>
                    <div className="flex items-center mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selectedRoles.includes(role.id) ? 'border-current bg-current' : 'border-gray-300 bg-white'
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
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className={`px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transform hover:-translate-y-0.5 transition-all duration-200 ${mutation.isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {mutation.isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating User...
                </div>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
