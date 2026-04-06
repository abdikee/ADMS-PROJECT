import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, Lock, User, Eye, EyeOff, BookOpen, Users, BarChart3, Shield } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { toast } from '../components/ui/sonner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const FEATURES = [
  { icon: BookOpen, title: 'Academic Records', desc: 'Manage grades, marks, and student progress in one place.' },
  { icon: Users, title: 'Multi-Role Access', desc: 'Tailored dashboards for admins, teachers, and students.' },
  { icon: BarChart3, title: 'Insightful Reports', desc: 'Generate class and student reports instantly.' },
  { icon: Shield, title: 'Secure & Reliable', desc: 'Role-based access control keeps data safe.' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_50%,#1d4ed8_100%)] flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-white/[0.03]" />

        {/* brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Marvel School</p>
              <p className="text-sm text-white/60">Academic Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Empowering Education<br />
            <span className="text-blue-300">Through Smart Records</span>
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            A unified platform for managing student academics — from marks entry to report generation — built for every role in your school.
          </p>
        </div>

        {/* features */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/12 transition-colors">
              <div className="w-9 h-9 bg-blue-500/30 rounded-xl flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-blue-200" />
              </div>
              <p className="font-semibold text-sm text-white mb-1">{title}</p>
              <p className="text-xs text-white/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* footer */}
        <p className="relative z-10 text-white/30 text-xs mt-8">
          © {new Date().getFullYear()} Marvel School · All rights reserved
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 sm:p-10">
        {/* mobile brand */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">Marvel School</p>
            <p className="text-xs text-gray-500">Academic Management System</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
            <p className="text-gray-500 text-sm">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="your.username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </Button>
          </form>

          {/* role hint */}
          <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Access Roles</p>
            <div className="flex flex-wrap gap-2">
              {['Admin', 'Teacher', 'Student'].map((role) => (
                <span key={role} className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded-full">
                  {role}
                </span>
              ))}
            </div>
            <p className="text-xs text-blue-600/70 mt-2">Contact your administrator if you need access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
