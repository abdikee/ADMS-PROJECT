import React, { useMemo, useState } from 'react';
import { Users, FileText, CheckCircle, Clock, School } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { useNavigate } from 'react-router';
import { DashboardHeader } from './DashboardHeader.jsx';
import {
  formatTeacherClassLabel,
  getTeacherAssignedClasses,
  getTeacherAssignedClassIds,
} from '../../utils/teacherAssignments.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.jsx';

export function TeacherDashboard() {
  const { students, teachers, classes, loading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const currentTeacher = teachers.find((teacher) => teacher.id === user?.id) || null;
  const assignedClassIds = getTeacherAssignedClassIds(currentTeacher, classes);
  const assignedClasses = getTeacherAssignedClasses(currentTeacher, classes);
  const [selectedClassId, setSelectedClassId] = useState('');
  const activeClassId = selectedClassId || assignedClasses[0]?.id || '';
  const activeClass = assignedClasses.find((classItem) => classItem.id === activeClassId) || assignedClasses[0] || null;
  const assignedStudents = useMemo(
    () => (
      activeClassId
        ? students.filter((student) => String(student.classId) === activeClassId)
        : students.filter((student) => assignedClassIds.includes(String(student.classId)))
    ),
    [activeClassId, assignedClassIds, students]
  );

  React.useEffect(() => {
    if (!selectedClassId) return;

    const hasSelectedClass = assignedClasses.some((classItem) => classItem.id === selectedClassId);
    if (!hasSelectedClass) {
      setSelectedClassId('');
    }
  }, [assignedClasses, selectedClassId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const teacherName = `${currentTeacher?.firstName || ''} ${currentTeacher?.lastName || ''}`.trim() || user?.name || 'Teacher';
  const teacherDepartment = currentTeacher?.departmentName || 'General';

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Teaching Workspace"
        title={`Welcome, ${teacherName}`}
        description={`Department: ${teacherDepartment}\nSubject: ${currentTeacher?.subjectName || 'Not assigned'}\nActive Class: ${activeClass ? formatTeacherClassLabel(activeClass) : 'No class assigned'}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/students')}>
            View Students
          </Button>
          <Button variant="outline" onClick={() => navigate(activeClassId ? `/marks?classId=${activeClassId}` : '/marks')}>
            Enter Marks
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/reports')}>
            View Reports
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Students</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{assignedStudents.length}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Teaching Classes</CardTitle>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{assignedClasses.length}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Assigned Subject</CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">{currentTeacher?.subjectName || 'None'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Assigned Students</CardTitle>
              <div className="flex gap-2">
                <Select value={activeClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {formatTeacherClassLabel(classItem)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="px-3 py-1 text-sm border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedStudents
                  .filter((student) => (`${student.firstName || ''} ${student.lastName || ''} ${student.className || ''}`).toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 8)
                  .map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {(student.firstName || 'S').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">Class: {student.className || '-'} | Roll: {student.rollNumber}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(activeClassId ? `/marks?classId=${activeClassId}` : '/students')}>View</Button>
                    </div>
                  ))}
                {assignedStudents.filter((student) => (`${student.firstName || ''} ${student.lastName || ''} ${student.className || ''}`).toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No students found for the selected class.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Teaching Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {assignedClasses.length > 0 ? (
                  assignedClasses.map((classItem) => (
                    <Badge key={classItem.id} variant="secondary" className="px-3 py-1 bg-blue-50 text-blue-700">
                      {formatTeacherClassLabel(classItem)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No classes assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start text-left" variant="outline" onClick={() => navigate('/students')}>
                <CheckCircle className="mr-2 w-4 h-4" />
                Read Student Info
              </Button>
              <Button className="w-full justify-start text-left" variant="outline" onClick={() => navigate(activeClassId ? `/marks?classId=${activeClassId}` : '/marks')}>
                <FileText className="mr-2 w-4 h-4" />
                Grade My Subject
              </Button>
              <Button className="w-full justify-start text-left" variant="outline" onClick={() => navigate('/reports')}>
                <Clock className="mr-2 w-4 h-4" />
                View Class Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
