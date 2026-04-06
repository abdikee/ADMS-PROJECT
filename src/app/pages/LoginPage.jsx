import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const validate = () => {
    const errors = {};
    if (!username.trim()) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'username') setUsername(value);
    else setPassword(value);
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-blue-200 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-indigo-200 rounded-full opacity-30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Marvel School</h1>
          <p className="text-sm text-blue-700 font-medium mt-1">Academic Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 pt-8 pb-2">
            <h2 className="text-xl font-semibold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to your school account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-8 pt-5 pb-8 space-y-5">
            {/* Global error */}
            {error && (
              <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your ID"
                  value={username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.username}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 ${
                    fieldErrors.username ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200'
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p id="username-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 ${
                    fieldErrors.password ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-blue-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="mt-5 text-center space-y-1">
          <p className="text-xs text-gray-500">
            Use the username and password provided by your school.
          </p>
          <p className="text-xs text-gray-400">Do not share your credentials with anyone.</p>
          <p className="text-xs text-gray-400 mt-2">
            Need help?{' '}
            <button
              type="button"
              onClick={() => alert('Please contact your school administration for assistance.')}
              className="text-blue-600 hover:underline focus:outline-none focus:underline"
            >
              Contact Admin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
