import { useAuthStore } from '../store/authStore';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 font-medium dark:text-slate-400">Manage your account settings</p>
      </div>

      <div className="glass-premium dark:bg-boxdark/90 shadow-xl rounded-2xl border border-white/20 dark:border-white/5">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Profile Information
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{user?.firstName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{user?.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Roles</dt>
              <dd className="mt-1">
                <div className="flex space-x-2">
                  {user?.roles?.map((role: any) => {
                    const roleName = typeof role === 'string' ? role : role.name;
                    return (
                      <span
                        key={roleName}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleName === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : roleName === 'manager'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : roleName === 'employee'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : roleName === 'driver'
                                ? 'bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary-400'
                                : roleName === 'vendor'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                      >
                        {roleName}
                      </span>
                    );
                  })}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 glass-premium dark:bg-boxdark/90 shadow-xl rounded-2xl border border-white/20 dark:border-white/5">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Access Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-boxdark-2/60 rounded-xl border border-slate-100/50 dark:border-white/5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Dashboard Access</span>
              <span className="text-sm text-green-600 dark:text-green-400">✓ Allowed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-boxdark-2/60 rounded-xl border border-slate-100/50 dark:border-white/5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Admin Panel Access</span>
              <span className={`text-sm ${useAuthStore.getState().isAdmin() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {useAuthStore.getState().isAdmin() ? '✓ Allowed' : '✗ Restricted'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-boxdark-2/60 rounded-xl border border-slate-100/50 dark:border-white/5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">User Management</span>
              <span className={`text-sm ${useAuthStore.getState().isAdmin() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {useAuthStore.getState().isAdmin() ? '✓ Allowed' : '✗ Restricted'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

