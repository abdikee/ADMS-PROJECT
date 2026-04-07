import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { getTeacherAssignedClassIds } from '../../utils/teacherAssignments.js';
import { DashboardHeader } from './DashboardHeader.jsx';
import { Skeleton } from '../ui/skeleton.jsx';
import { Alert, AlertDescription } from '../ui/alert.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.jsx';

export function TeacherDashboard() {
  const { user } = useAuth();
  const { teachers, classes, students, subjects, marks, loading } = useData();

  const {
    currentTeacher,
    assignedClassIds,
    assignedClasses,
    assignedSubject,
    classStudents,
    teacherMarks,
  } = useMemo(() => {
    const teacher = teachers.find((t) => String(t.id) === String(user?.id)) ?? null;
    const classIds = getTeacherAssignedClassIds(teacher, classes);
    const assignedCls = classes.filter((c) => classIds.includes(String(c.id)));
    const subject = teacher?.subjectId
      ? subjects.find((s) => String(s.id) === String(teacher.subjectId)) ?? null
      : null;
    const clsStudents = students.filter((s) => classIds.includes(String(s.classId)));
    const tMarks = marks.filter(
      (m) =>
        classIds.includes(String(m.classId)) &&
        teacher?.subjectId != null &&
        String(m.subjectId) === String(teacher.subjectId)
    );

    return {
      currentTeacher: teacher,
      assignedClassIds: classIds,
      assignedClasses: assignedCls,
      assignedSubject: subject,
      classStudents: clsStudents,
      teacherMarks: tMarks,
    };
  }, [user, teachers, classes, students, subjects, marks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentTeacher) {
    return (
      <Alert>
        <AlertDescription>
          Your teacher profile could not be loaded. Please refresh or contact an administrator.
        </AlertDescription>
      </Alert>
    );
  }

  if (assignedClassIds.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          You have no class or subject assignments yet. Contact your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Teacher Portal"
        title={Welcome, }
        description={${assignedSubject?.name ?? 'No subject'} ·  class(es)}
      />

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* OverviewTab - implemented in task 4 */}
        </TabsContent>

        <TabsContent value="classes">
          {/* MyClassesTab - implemented in task 5 */}
        </TabsContent>

        <TabsContent value="students">
          {/* StudentsTab - implemented in task 6 */}
        </TabsContent>

        <TabsContent value="marks">
          {/* MarksTab - implemented in task 8 */}
        </TabsContent>

        <TabsContent value="reports">
          {/* ReportsTab - implemented in task 9 */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
