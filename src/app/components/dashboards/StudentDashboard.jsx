import React, { useMemo } from 'react';
import { FileText, TrendingUp, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import { DashboardHeader } from './DashboardHeader.jsx';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Fix #9 & #10: pull real data and loading state
  const { marks, subjects, loading } = useData();

  const studentMarks = useMemo(
    () => marks.filter((m) => m.studentId === user?.id),
    [marks, user?.id]
  );

  const marksWithSubjects = useMemo(
    () => studentMarks.map((m) => {
      const subject = subjects.find((s) => s.id === m.subjectId);
      return {
        ...m,
        subjectName: subject?.name || 'Unknown',
        maxMarks: subject?.maxMarks || m.maxMarks || 100,
      };
    }),
    [studentMarks, subjects]
  );

  const overallPercentage = useMemo(() => {
    if (marksWithSubjects.length === 0) return null;
    const obtained = marksWithSubjects.reduce((sum, m) => sum + m.marks, 0);
    const max = marksWithSubjects.reduce((sum, m) => sum + m.maxMarks, 0);
    return max > 0 ? ((obtained / max) * 100).toFixed(1) : null;
  }, [marksWithSubjects]);

  // Fix #10: loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Student Portal"
        title="My Academic Report"
        description={`Welcome ${user?.name || 'Student'}, here is a summary of your academic performance.`}
      />

      {/* Fix #9: show real stats instead of empty page */}
      {overallPercentage !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Performance</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{overallPercentage}%</div>
              <Badge
                variant="outline"
                className={Number(overallPercentage) >= 50
                  ? 'mt-1 bg-green-50 text-green-700 border-green-200'
                  : 'mt-1 bg-red-50 text-red-700 border-red-200'}
              >
                {Number(overallPercentage) >= 50 ? 'PASS' : 'FAIL'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Subjects Graded</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{marksWithSubjects.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {marksWithSubjects.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Subject Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marksWithSubjects.map((m) => {
                const pct = ((m.marks / m.maxMarks) * 100).toFixed(0);
                const passing = Number(pct) >= 50;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{m.subjectName}</p>
                      <p className="text-xs text-gray-500">{m.marks} / {m.maxMarks} marks</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${passing ? 'bg-green-500' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(Number(pct), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-200">
        <CardContent className="py-8 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Full Report Card</h3>
            <p className="text-sm text-gray-500">View your complete academic report with grades and performance summary.</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/reports')}
          >
            <FileText className="mr-2 h-4 w-4" />
            View My Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
