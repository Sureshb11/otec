import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

interface RequestPasswordResetForm {
  email: string;
}

const RequestPasswordReset = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetForm>();

  const onSubmit = async (data: RequestPasswordResetForm) => {
    setIsLoading(true);
    setMessage(null);
    setResetToken(null);

    try {
      const response = await api.post('/auth/request-password-reset', { email: data.email });
      setMessage({ type: 'success', text: response.data.message });
      if (response.data.token) {
        setResetToken(response.data.token);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'An error occurred. Please try again.',
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
        {/* Subtle geometric background pattern */}
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
            Reset Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Password</span>
          </h2>
          <p className="text-sm text-blue-200/70 font-medium">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="rounded-3xl p-10 relative group bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none"></div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold text-blue-200/60 mb-2 uppercase tracking-wider">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                  })}
                  type="email"
                  autoComplete="email"
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-xs font-semibold text-rose-400 tracking-wide">{errors.email.message}</p>
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

            {resetToken && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-sm text-blue-300 font-bold mb-2">Development Mode:</p>
                <p className="text-xs text-blue-200/70 mb-2">Reset token (for testing):</p>
                <p className="text-xs text-blue-400 font-mono break-all">{resetToken}</p>
                <Link to={`/reset-password?token=${resetToken}`} className="text-xs text-blue-400 hover:text-blue-300 underline mt-2 inline-block font-semibold">Click here to reset password →</Link>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden flex justify-center items-center py-4 px-4 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-[#1956a8] to-[#2563eb] hover:from-[#1e63bf] hover:to-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(25,86,168,0.5)] hover:shadow-[0_0_35px_rgba(25,86,168,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Auto-shimmer effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer z-0"></span>
                <span className="relative z-10 flex items-center">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </span>
              </button>
            </div>

            <div className="text-center pt-4 border-t border-white/10">
              <Link to="/login" className="text-sm text-blue-300 hover:text-blue-200 font-semibold tracking-wide transition-colors duration-200 inline-block">
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

export default RequestPasswordReset;
