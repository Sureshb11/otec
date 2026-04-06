import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { authApi, LoginCredentials } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    setError(null);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0d1b3e] via-[#122b5e] to-[#1956a8] animate-gradient-x relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/15 blur-[120px] animate-float"></div>
        <div className="absolute top-[60%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1956a8]/25 blur-[150px] animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-5%] left-[30%] w-[30%] h-[30%] rounded-full bg-blue-400/10 blur-[100px] animate-float" style={{ animationDelay: '4s' }}></div>

        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}></div>
      </div>

      {/* Left Side - Brand & Presentation */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-xl text-center flex flex-col items-center space-y-5 animate-slideUp">
          <div className="relative inline-block mb-3">
            <img src="/logo-full-transparent.png" alt="OTEC Oil Technology" className="relative z-10 w-[340px] max-w-full h-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-2xl pt-2 leading-tight">
            Assets Management <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">System</span>
          </h1>

          {/* Trust Indicators - Pill Style */}
          <div className="flex flex-row items-center justify-center space-x-3 pt-6 w-full max-w-md mx-auto">
            <div className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] text-blue-100/90 hover:bg-white/[0.15] hover:text-white transition-all duration-300 cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">Secure</span>
            </div>
            <div className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] text-blue-100/90 hover:bg-white/[0.15] hover:text-white transition-all duration-300 cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">Fast</span>
            </div>
            <div className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] text-blue-100/90 hover:bg-white/[0.15] hover:text-white transition-all duration-300 cursor-default">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">Reliable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 z-10">
        <div className="w-full max-w-md animate-slideUp" style={{ animationDelay: '0.15s' }}>
          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-10 w-full flex justify-center">
            <img src="/logo-full-transparent.png" alt="OTEC Oil Technology" className="w-[320px] h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>

          <div className="rounded-3xl p-10 relative group bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none"></div>

            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                Welcome Back
              </h2>
              <p className="text-blue-200/70 text-sm font-medium">
                Authenticate to manage operations
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 animate-slideUp">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-red-300 font-medium">{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within/input:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      {...register('email', { required: 'Email is required' })}
                      type="email"
                      autoComplete="email"
                      className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                      placeholder="Email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs font-semibold text-rose-400 tracking-wide">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field with visibility toggle */}
                <div>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400 group-focus-within/input:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                      placeholder="Password"
                    />
                    {/* Password visibility toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-xs font-semibold text-rose-400 tracking-wide">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Sign In Button with shimmer */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full relative overflow-hidden flex justify-center items-center py-4 px-4 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-[#1956a8] to-[#2563eb] hover:from-[#1e63bf] hover:to-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(25,86,168,0.5)] hover:shadow-[0_0_35px_rgba(25,86,168,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                  {/* Auto-shimmer effect */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer z-0"></span>

                  <span className="relative z-10 flex items-center">
                    {mutation.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                </button>
              </div>

              <div className="text-center space-y-4 pt-4 border-t border-white/10">
                <Link
                  to="/request-password-reset"
                  className="text-sm text-blue-300 hover:text-blue-200 font-semibold tracking-wide transition-colors duration-200 inline-block"
                >
                  Recover Password
                </Link>
                <p className="text-xs text-blue-200/40 tracking-wide">
                  Contact system administrator for provisioning
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.8s ease-out both; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Login;
