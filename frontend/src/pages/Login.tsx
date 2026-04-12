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
      setAuth(data.user, data.access_token, data.permissions);
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
    <div className="min-h-screen flex bg-gradient-to-br from-[#0a1628] via-[#0f2347] to-[#1956a8] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-float" />
        <div className="absolute top-[60%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#1956a8]/20 blur-[150px] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-5%] left-[30%] w-[30%] h-[30%] rounded-full bg-blue-400/8 blur-[100px] animate-float" style={{ animationDelay: '4s' }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      {/* Left Side - Brand & Presentation */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-xl text-center flex flex-col items-center space-y-6 animate-slideUp">
          <div className="relative inline-block mb-2">
            <img src="/logo-full-transparent.png" alt="OTEC Oil Technology" className="relative z-10 w-[340px] max-w-full h-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Assets Management <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-100 to-white">System</span>
          </h1>

          <p className="text-blue-200/50 text-sm max-w-sm leading-relaxed font-medium">
            Streamline your oilfield tool tracking, rental operations, and maintenance scheduling in one unified platform.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-row items-center justify-center gap-3 pt-4 w-full max-w-md mx-auto">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Fast' },
              { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', label: 'Reliable' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-blue-200/70 hover:bg-white/[0.12] hover:text-white transition-all duration-300 cursor-default">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 z-10">
        <div className="w-full max-w-[420px] animate-slideUp" style={{ animationDelay: '0.15s' }}>
          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-8 w-full flex justify-center">
            <img src="/logo-full-transparent.png" alt="OTEC Oil Technology" className="w-[280px] h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </div>

          <div className="rounded-3xl p-8 sm:p-10 relative group bg-white/[0.05] backdrop-blur-2xl border border-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(59,130,246,0.4)]">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-blue-300/50 text-sm font-medium mt-1.5">
                Sign in to access your dashboard
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {/* Error Alert */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 animate-slideUp">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-red-300 font-semibold">{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-blue-200/40 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      {...register('email', { required: 'Email is required' })}
                      type="email"
                      autoComplete="email"
                      className="block w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-blue-200/25 bg-white/[0.06] border border-white/[0.08] shadow-sm transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.12] focus:outline-none focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] text-sm font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs font-bold text-rose-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-blue-200/40 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="block w-full pl-12 pr-12 py-3.5 rounded-xl text-white placeholder-blue-200/25 bg-white/[0.06] border border-white/[0.08] shadow-sm transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.12] focus:outline-none focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] text-sm font-medium"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300/30 hover:text-blue-400 transition-colors duration-200"
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
                    <p className="mt-2 text-xs font-bold text-rose-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Remember me + Forgot password row */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0" />
                  <span className="text-xs font-semibold text-blue-200/40 group-hover/check:text-blue-200/60 transition-colors">Remember me</span>
                </label>
                <Link
                  to="/request-password-reset"
                  className="text-xs text-blue-400/60 hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full relative overflow-hidden flex justify-center items-center py-4 px-4 rounded-xl text-white font-bold tracking-wider uppercase text-sm bg-gradient-to-r from-[#1956a8] to-[#2563eb] hover:from-[#1e63bf] hover:to-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-[#0f2347] shadow-[0_0_25px_rgba(25,86,168,0.5)] hover:shadow-[0_0_40px_rgba(25,86,168,0.7)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group/btn"
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer z-0" />

                  <span className="relative z-10 flex items-center gap-2">
                    {mutation.isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
              <p className="text-[11px] text-blue-200/25 font-medium tracking-wide">
                Need access? Contact your system administrator
              </p>
            </div>
          </div>

          {/* Version tag */}
          <p className="text-center text-[10px] text-blue-200/15 font-bold uppercase tracking-widest mt-6">
            OTEC AMS v1.0
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.6s ease-out both; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Login;
