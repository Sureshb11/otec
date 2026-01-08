import { useAuthStore } from '../store/authStore';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your account settings</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Profile Information
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">First Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.firstName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.lastName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Roles</dt>
              <dd className="mt-1">
                <div className="flex space-x-2">
                  {user?.roles?.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : role === 'manager'
                          ? 'bg-yellow-100 text-yellow-800'
                          : role === 'employee'
                          ? 'bg-green-100 text-green-800'
                          : role === 'driver'
                          ? 'bg-primary-100 text-primary-800'
                          : role === 'vendor'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Access Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Dashboard Access</span>
              <span className="text-sm text-green-600">✓ Allowed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Admin Panel Access</span>
              <span className={`text-sm ${user?.roles?.includes('admin') ? 'text-green-600' : 'text-red-600'}`}>
                {user?.roles?.includes('admin') ? '✓ Allowed' : '✗ Restricted'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">User Management</span>
              <span className={`text-sm ${user?.roles?.includes('admin') ? 'text-green-600' : 'text-red-600'}`}>
                {user?.roles?.includes('admin') ? '✓ Allowed' : '✗ Restricted'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

