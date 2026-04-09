import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  School,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileText,
  Key,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Search,
  Bell,
  Settings,
  Moon,
  Sun,
  ChevronDown,
  Home,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { EnhancedButton } from './enhanced-button.jsx';

const sidebarVariants = {
  open: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  closed: { x: -256, transition: { duration: 0.3, ease: 'easeInOut' } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function EnhancedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Close sidebar on route change
    setSidebarOpen(false);
  }, [location]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getNavigation = () => {
    const nav = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Teacher', 'Student'], badge: null },
      { name: 'Classes', href: '/classes', icon: School, roles: ['Admin'], badge: null },
      { name: 'Students', href: '/students', icon: Users, roles: ['Admin', 'Teacher'], badge: 'New' },
      { name: 'Subjects', href: '/subjects', icon: BookOpen, roles: ['Admin'], badge: null },
      { name: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['Admin'], badge: null },
      { name: 'Marks', href: '/marks', icon: ClipboardList, roles: ['Teacher'], badge: null },
      { name: 'Reports', href: '/reports', icon: FileText, roles: ['Admin', 'Teacher', 'Student'], badge: null },
      { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['Admin', 'Teacher', 'Student'], badge: '2' },
      { name: 'Achievements', href: '/achievements', icon: Award, roles: ['Student'], badge: 'New' },
      { name: 'Credentials', href: '/credentials', icon: Key, roles: ['Admin'], badge: null },
    ];
    return nav.filter((item) => item.roles.includes(user.role));
  };

  const navigation = getNavigation();
  const initials = (user.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn('min-h-screen bg-gray-50 flex flex-col', darkMode && 'dark')}>
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">Marvel School</span>
                <span className="text-xs text-gray-500 block">Management System</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'group relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border-l-4 border-l-blue-500'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 transition-transform duration-200',
                      isActive && 'scale-110'
                    )}>
                      <item.icon />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute right-2 w-1 h-6 bg-blue-500 rounded-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-gray-500" />
                <h1 className="text-xl font-semibold text-gray-900">Marvel School</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
              </div>

              {/* User menu */}
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
        <div className="flex justify-around">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
