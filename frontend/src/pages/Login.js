import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate is already imported, so we'll use it
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // Initialize the hook
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  // Demo credentials for easy login
  const demoCredentials = [
    { username: 'admin', password: 'admin123', role: 'Administrator', description: 'Full system access' },
    { username: 'commander.fl', password: 'commander123', role: 'Commander', description: 'Base operations' },
    { username: 'logistics.fl', password: 'logistics123', role: 'Logistics', description: 'Asset management' }
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        toast.success('Login successful!');
        
        // 2. The Fix: Replace the hard page reload with client-side navigation
        navigate('/dashboard', { replace: true }); 
        // { replace: true } prevents the user from going back to the login page with the browser's back button.

      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Login submit error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (username, password) => {
    setValue('username', username);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">MAMS</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Military Asset Management
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Secure access to logistics operations
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('username', { required: 'Username is required' })}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Username or Email"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                )}
              </div>
              
              <div className="relative">
                <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Demo Credentials Below Login Button */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Demo Credentials
              </h3>
              <p className="text-sm text-gray-300 mb-4 text-center">
                Click any credential to auto-fill the form
              </p>
              
              <div className="space-y-2">
                {demoCredentials.map((cred, index) => (
                  <div
                    key={index}
                    onClick={() => handleQuickLogin(cred.username, cred.password)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-blue-300 text-sm">
                            {cred.role}
                          </p>
                          <p className="text-xs text-gray-400">
                            {cred.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          <span className="text-white font-mono">{cred.username}</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          <span className="text-white font-mono">{cred.password}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">
                Authorized personnel only. All activities are monitored and logged.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;