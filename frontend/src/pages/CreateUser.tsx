import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserData>();

  // Fetch available roles
  const { data: roles } = useQuery<Role[]>({
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


  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          <p className="mt-2 text-sm text-gray-600">Add a new user to the system (Admin Only)</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Role *</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select a role for this user. Each user must have at least one role.
              </p>
              <div className="space-y-3">
                {roles?.filter(role => role.name !== 'admin').map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => {
                        setSelectedRoles([role.id]);
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
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
                          {selectedRoles.includes(role.id) ? 'Selected' : 'Not Selected'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedRoles.length === 0 && (
                <p className="mt-2 text-sm text-red-600">Please select a role for this user.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {mutation.isLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;

