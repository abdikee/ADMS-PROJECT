import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.jsx';
import { Button } from './ui/button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getNavigation = () => {
    const nav = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Teacher', 'Student'] },
      { name: 'Classes', href: '/classes', icon: School, roles: ['Admin'] },
      { name: 'Students', href: '/students', icon: Users, roles: ['Admin', 'Teacher'] },
      { name: 'Subjects', href: '/subjects', icon: BookOpen, roles: ['Admin'] },
      { name: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['Admin'] },
      { name: 'Marks', href: '/marks', icon: ClipboardList, roles: ['Teacher'] },
      { name: 'Reports', href: '/reports', icon: FileText, roles: ['Admin', 'Teacher', 'Student'] },
      { name: 'Credentials', href: '/credentials', icon: Key, roles: ['Admin'] },
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">EduRecord</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="w-8 h-8 border border-gray-200">
                <AvatarImage src={user.profilePhoto} alt={user.name} />
                <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              Student Academic Record Management System
            </h1>
            <h1 className="text-lg font-semibold text-gray-900 sm:hidden">
              EduRecord
            </h1>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full shrink-0 ml-4">
                  <Avatar className="w-8 h-8 border border-blue-200">
                    <AvatarImage src={user.profilePhoto} alt={user.name} />
                    <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
