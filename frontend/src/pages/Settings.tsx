import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/apiClient';

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const { user } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>();

  const newPassword = watch('newPassword');

  const onChangePassword = async (data: ChangePasswordForm) => {
    setMessage(null);
    setSubmitting(true);
    try {
      await apiClient.auth.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated. You will need to sign in again on other devices.' });
      reset();
    } catch (err: any) {
      const raw = err?.response?.data?.message;
      const text = Array.isArray(raw) ? raw.join('; ') : raw || 'Failed to update password';
      setMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

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
          <h3 className="text-lg leading-6 font-black text-slate-900 dark:text-white mb-1 tracking-tight">
            Change Password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            After changing your password, your other active sessions will be signed out.
          </p>

          <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                {...register('currentPassword', { required: 'Current password is required' })}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-strokedark rounded-xl bg-white/70 dark:bg-boxdark text-sm dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: 'Must contain a letter and a number',
                  },
                })}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-strokedark rounded-xl bg-white/70 dark:bg-boxdark text-sm dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === newPassword || 'Passwords do not match',
                })}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-strokedark rounded-xl bg-white/70 dark:bg-boxdark text-sm dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.confirmPassword.message}</p>
              )}
            </div>

            {message && (
              <div
                className={`rounded-xl p-3 text-sm font-semibold ${
                  message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/40'
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-700/40'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
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
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Allowed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-boxdark-2/60 rounded-xl border border-slate-100/50 dark:border-white/5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Admin Panel Access</span>
              <span className={`text-sm ${useAuthStore.getState().isAdmin() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {useAuthStore.getState().isAdmin() ? <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Allowed</span> : <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Restricted</span>}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-boxdark-2/60 rounded-xl border border-slate-100/50 dark:border-white/5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">User Management</span>
              <span className={`text-sm ${useAuthStore.getState().isAdmin() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {useAuthStore.getState().isAdmin() ? <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Allowed</span> : <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> Restricted</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
