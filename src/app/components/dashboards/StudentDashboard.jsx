import React from 'react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">My Academic Report</h2>
        <p className="text-gray-600 mt-1">
          Welcome {user?.name || 'Student'}, please view your academic report card below.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Your Report Card</h3>
            <p className="text-gray-600 max-w-md">
              Access your complete academic report including all subjects, marks, grades, and performance summary.
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/reports')}
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            View My Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
