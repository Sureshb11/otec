import { useAuthStore } from '../store/authStore';

const AdminPanel = () => {
  const { user } = useAuthStore();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="glass-premium dark:bg-boxdark/90 rounded-2xl shadow-xl border border-white/20 dark:border-white/5 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight mb-4">
            Admin Panel
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Welcome, {user?.firstName}! This is the admin-only section.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel dark:bg-boxdark/60 overflow-hidden shadow-lg rounded-2xl border border-white/20 dark:border-white/5">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">
                      Admin Only
                    </dt>
                    <dd className="text-lg font-black text-slate-900 dark:text-white">
                      Full Access
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel dark:bg-boxdark/60 overflow-hidden shadow-lg rounded-2xl border border-white/20 dark:border-white/5">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">M</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">
                      Management
                    </dt>
                    <dd className="text-lg font-black text-slate-900 dark:text-white">
                      Available
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel dark:bg-boxdark/60 overflow-hidden shadow-lg rounded-2xl border border-white/20 dark:border-white/5">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-bold text-slate-500 dark:text-slate-400 truncate">
                      System Status
                    </dt>
                    <dd className="text-lg font-black text-slate-900 dark:text-white">
                      Operational
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-2xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Admin Access Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Only users with the 'admin' role can access this page. Regular users will be redirected to the dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

