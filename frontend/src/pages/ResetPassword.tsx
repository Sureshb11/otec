import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset link. Please request a new password reset.' });
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset token. Please request a new password reset.' });
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
      setTimeout(() => { navigate('/login'); }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reset password. The link may have expired.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d1b3e] via-[#122b5e] to-[#1956a8] relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/15 blur-[120px]"></div>
        <div className="absolute top-[60%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1956a8]/25 blur-[150px]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 z-10 animate-slideUp">
        {/* Header with Logo */}
        <div className="text-center">
          <img src="/logo-full-transparent.png" alt="OTEC Oil Technology" className="w-[340px] max-w-[85vw] h-auto mx-auto mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Set New <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Password</span>
          </h2>
          <p className="text-sm text-blue-200/70 font-medium">Enter your new password below.</p>
        </div>

        <div className="rounded-3xl p-10 relative group bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none"></div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold text-blue-200/60 mb-2 uppercase tracking-wider">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  {...register('newPassword', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                  placeholder="Enter new password"
                />
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-xs font-semibold text-rose-400 tracking-wide">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200/60 mb-2 uppercase tracking-wider">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                  placeholder="Confirm new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-xs font-semibold text-rose-400 tracking-wide">{errors.confirmPassword.message}</p>
              )}
            </div>

            {message && (
              <div className={`rounded-xl p-4 animate-slideUp ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'}`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  <p className="text-sm font-semibold">{message.text}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full relative overflow-hidden flex justify-center items-center py-4 px-4 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-[#1956a8] to-[#2563eb] hover:from-[#1e63bf] hover:to-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(25,86,168,0.5)] hover:shadow-[0_0_35px_rgba(25,86,168,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer z-0"></span>
                <span className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </span>
              </button>
            </div>

            <div className="text-center space-y-3 pt-4 border-t border-white/10">
              <Link to="/request-password-reset" className="text-sm text-blue-300 hover:text-blue-200 font-semibold block tracking-wide transition-colors">
                Request New Reset Link
              </Link>
              <Link to="/login" className="text-sm text-blue-200/50 hover:text-white font-semibold block tracking-wide transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slideUp { animation: slideUp 0.8s ease-out both; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ResetPassword;
