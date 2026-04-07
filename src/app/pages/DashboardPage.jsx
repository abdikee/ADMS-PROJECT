import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { AdminDashboard } from '../components/dashboards/AdminDashboard.jsx';
import { StudentDashboard } from '../components/dashboards/StudentDashboard.jsx';
import { TeacherDashboard } from '../components/dashboards/TeacherDashboard.jsx';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const { error } = useData();

  if (!user) return null;

  let dashboard;

  switch (user.role) {
    case 'Admin':
      dashboard = <AdminDashboard />;
      break;
    case 'Teacher':
      dashboard = <TeacherDashboard />;
      break;
    case 'Student':
      dashboard = <StudentDashboard />;
      break;
    default:
      dashboard = <div>Invalid Role</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Some dashboard data is unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {dashboard}
    </div>
  );
}
