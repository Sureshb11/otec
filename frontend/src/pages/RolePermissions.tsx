import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

interface Permission {
  id: string;
  moduleName: string;
  feature: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  roleId: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const RolePermissions = () => {
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'Feature' | 'Module' | 'AI' | 'Candidate Data'>('Feature');

  // Fetch role details
  const { data: role } = useQuery<Role>({
    queryKey: ['role', roleId],
    queryFn: async () => {
      const response = await api.get(`/roles/${roleId}`);
      return response.data;
    },
    enabled: !!roleId,
  });

  // Create default permissions mutation
  const createDefaultsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/permissions/role/${roleId}/defaults`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', roleId] });
    },
  });

  // Fetch permissions
  const { data: permissions, isLoading } = useQuery<Permission[]>({
    queryKey: ['permissions', roleId],
    queryFn: async () => {
      try {
        const response = await api.get(`/permissions/role/${roleId}`);
        return response.data;
      } catch (err: any) {
        // If 404 or empty, create defaults
        if (err.response?.status === 404 || !err.response?.data?.length) {
          if (roleId) {
            createDefaultsMutation.mutate();
          }
          return [];
        }
        throw err;
      }
    },
    enabled: !!roleId,
    retry: false,
  });

  // Update permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async (updatedPermissions: Permission[]) => {
      const response = await api.put(`/permissions/role/${roleId}/bulk`, updatedPermissions);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', roleId] });
    },
  });

  // Filter permissions by search term
  const filteredPermissions = useMemo(() => {
    if (!permissions) return [];
    return permissions.filter(
      (perm) =>
        perm.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [permissions, searchTerm]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    filteredPermissions.forEach((perm) => {
      if (!grouped[perm.moduleName]) {
        grouped[perm.moduleName] = [];
      }
      grouped[perm.moduleName].push(perm);
    });
    return grouped;
  }, [filteredPermissions]);

  const handleToggle = (permissionId: string, field: 'canView' | 'canAdd' | 'canEdit' | 'canDelete') => {
    if (!permissions) return;

    const updatedPermissions = permissions.map((perm) =>
      perm.id === permissionId
        ? { ...perm, [field]: !perm[field] }
        : perm
    );

    updatePermissionsMutation.mutate(updatedPermissions);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/roles')}
          className="text-primary-600 hover:text-primary-700 mb-2 flex items-center"
        >
          <span className="mr-2">←</span> Back to Roles
        </button>
        <h1 className="text-3xl font-bold text-gray-900 capitalize">
          {role?.name} Permissions
        </h1>
        <p className="mt-2 text-sm text-gray-600">{role?.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {(['AI', 'Candidate Data', 'Feature', 'Module'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex justify-end">
        <div className="relative">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Add
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edit
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) =>
                modulePermissions.map((permission, index) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    {index === 0 && (
                      <td
                        rowSpan={modulePermissions.length}
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-top"
                      >
                        {moduleName}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permission.feature}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permission.canView}
                          onChange={() => handleToggle(permission.id, 'canView')}
                          className="sr-only peer"
                          disabled={updatePermissionsMutation.isLoading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permission.canAdd}
                          onChange={() => handleToggle(permission.id, 'canAdd')}
                          className="sr-only peer"
                          disabled={updatePermissionsMutation.isLoading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permission.canEdit}
                          onChange={() => handleToggle(permission.id, 'canEdit')}
                          className="sr-only peer"
                          disabled={updatePermissionsMutation.isLoading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permission.canDelete}
                          onChange={() => handleToggle(permission.id, 'canDelete')}
                          className="sr-only peer"
                          disabled={updatePermissionsMutation.isLoading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredPermissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No permissions found.</p>
            {!permissions || permissions.length === 0 ? (
              <button
                onClick={() => createDefaultsMutation.mutate()}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 hover:shadow-md transition-all duration-200"
              >
                Create Default Permissions
              </button>
            ) : null}
          </div>
        )}
      </div>

      {updatePermissionsMutation.isLoading && (
        <div className="mt-4 text-center text-sm text-gray-600">Saving permissions...</div>
      )}
    </div>
  );
};

export default RolePermissions;

