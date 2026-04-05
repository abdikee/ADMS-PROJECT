import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ClassesPage } from './pages/ClassesPage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';
import { SubjectsPage } from './pages/SubjectsPage.jsx';
import { TeachersPage } from './pages/TeachersPage.jsx';
import { MarksPage } from './pages/MarksPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { CredentialsPage } from './pages/CredentialsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function RouteGuard({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <RouteGuard allowedRoles={['Admin', 'Teacher', 'Student']}>
        <Layout />
      </RouteGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <RouteGuard allowedRoles={['Admin', 'Teacher', 'Student']}>
            <DashboardPage />
          </RouteGuard>
        ),
      },
      {
        path: 'classes',
        element: (
          <RouteGuard allowedRoles={['Admin']}>
            <ClassesPage />
          </RouteGuard>
        ),
      },
      {
        path: 'students',
        element: (
          <RouteGuard allowedRoles={['Admin', 'Teacher']}>
            <StudentsPage />
          </RouteGuard>
        ),
      },
      {
        path: 'subjects',
        element: (
          <RouteGuard allowedRoles={['Admin']}>
            <SubjectsPage />
          </RouteGuard>
        ),
      },
      {
        path: 'teachers',
        element: (
          <RouteGuard allowedRoles={['Admin']}>
            <TeachersPage />
          </RouteGuard>
        ),
      },
      {
        path: 'marks',
        element: (
          <RouteGuard allowedRoles={['Teacher']}>
            <MarksPage />
          </RouteGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RouteGuard allowedRoles={['Admin', 'Teacher', 'Student']}>
            <ReportsPage />
          </RouteGuard>
        ),
      },
      {
        path: 'credentials',
        element: (
          <RouteGuard allowedRoles={['Admin']}>
            <CredentialsPage />
          </RouteGuard>
        ),
      },
      {
        path: 'profile',
        element: (
          <RouteGuard allowedRoles={['Admin', 'Teacher', 'Student']}>
            <ProfilePage />
          </RouteGuard>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
