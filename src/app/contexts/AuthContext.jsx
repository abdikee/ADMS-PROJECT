import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import auth from '../services/auth.js';

const AuthContext = createContext(undefined);

const normalizeAuthUser = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  return {
    ...rawUser,
    id: rawUser.id !== undefined && rawUser.id !== null ? String(rawUser.id) : rawUser.id,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (nextUser) => {
    const normalizedUser = normalizeAuthUser(nextUser);
    setUser(normalizedUser);
    if (normalizedUser) {
      localStorage.setItem('sams_user', JSON.stringify(normalizedUser));
    } else {
      auth.clearSession();
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = auth.getUser();

        if (savedUser && auth.getToken()) {
          persistUser(savedUser);
        } else {
          auth.clearSession();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        auth.clearSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(auth.unauthorizedEvent, handleUnauthorized);
    return () => window.removeEventListener(auth.unauthorizedEvent, handleUnauthorized);
  }, []);

  const login = async (username, password) => {
    try {
      setIsLoading(true);

      const response = await api.login(username, password);

      const roleMap = {
        'admin': 'Admin',
        'teacher': 'Teacher',
        'student': 'Student',
      };

      const userData = {
        id: String(response.user.studentId || response.user.teacherId || response.user.id),
        name: response.user.name,
        role: roleMap[response.user.role] || 'Student',
        email: response.user.email,
        username: response.user.username,
      };

      auth.setSession(userData, response.token);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updates) => {
    if (!user) return;
    persistUser({ ...user, ...updates });
  };

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
