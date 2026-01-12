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
    <div className="min-h-screen flex bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-700">
      {/* Left Side - Background for Custom Vectors */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10">
          <div className="text-center space-y-6 animate-fadeIn">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              OTEC OIL TECHNOLOGY
            </h1>
            <p className="text-xl text-blue-200 max-w-md mx-auto font-medium drop-shadow-sm italic">
              "Driving Innovation, Fuelling Future!"
            </p>
          </div>
        </div>
        {/* Space for custom vectors - user will add their own */}
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">OTEC OIL TECHNOLOGY</h1>
            <p className="text-sm text-blue-200 italic">"Driving Innovation, Fuelling Future!"</p>
          </div>

          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to access your account
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-slideUp">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      {...register('email', { required: 'Email is required' })}
                      type="email"
                      autoComplete="email"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      {...register('password', { required: 'Password is required' })}
                      type="password"
                      autoComplete="current-password"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 transition-all duration-200"
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {mutation.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="text-center space-y-3">
                <Link
                  to="/request-password-reset"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 inline-block"
                >
                  Forgot your password?
                </Link>
                <p className="text-xs text-gray-500">
                  Contact your administrator to create an account
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(15deg);
          }
        }

        @keyframes slide-up-down {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes float-particle {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-10px) translateX(5px) scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
          }
        }

        @keyframes pumpjack {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(5deg);
          }
        }

        @keyframes slide-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
        }

        @keyframes slide-horizontal-reverse {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-10px);
          }
        }

        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-pumpjack {
          animation: pumpjack 2s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-slide-up-down {
          animation: slide-up-down 4s ease-in-out infinite;
        }

        .animate-slide-horizontal {
          animation: slide-horizontal 4s ease-in-out infinite;
        }

        .animate-slide-horizontal-reverse {
          animation: slide-horizontal-reverse 4s ease-in-out infinite;
        }

        .animate-rotate-slow {
          animation: rotate-slow 10s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;

