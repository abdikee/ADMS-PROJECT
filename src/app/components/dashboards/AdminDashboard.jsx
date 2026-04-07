import React from 'react';
import { Users, BookOpen, TrendingUp, GraduationCap, School, FileText, Key } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import { DashboardHeader } from './DashboardHeader.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#ef4444', '#8b5cf6'];

export function AdminDashboard() {
  const { students, subjects, teachers, marks, loading } = useData();
  const navigate = useNavigate();

  const totalStudents = students.length;
  const totalSubjects = subjects.length;
  const totalTeachers = teachers.length;

  // Fix #1: weight average against each mark's maxMarks instead of assuming 100
  const averagePerformance = marks.length > 0
    ? (() => {
        const totalObtained = marks.reduce((sum, m) => sum + m.marks, 0);
        const totalMax = marks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
        return totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
      })()
    : 0;

  // Fix #2: sort by id descending as a stable proxy for recency (no createdAt field)
  const recentStudents = [...students]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  // Fix #3: pieData with empty state handled in JSX
  const pieData = subjects.map((subject) => {
    const subjectMarks = marks.filter((m) => m.subjectId === subject.id);
    const totalObtained = subjectMarks.reduce((sum, m) => sum + m.marks, 0);
    const totalMax = subjectMarks.reduce((sum, m) => sum + (m.maxMarks || 100), 0);
    const avg = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    return { name: subject.name, value: Number(avg.toFixed(1)) };
  }).filter((d) => d.value > 0);

  const adminSections = [
    {
      title: 'Classes',
      description: 'Create classes and assign homeroom teachers.',
      icon: School,
      href: '/classes',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Students',
      description: 'Register students and manage class placement.',
      icon: Users,
      href: '/students',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Subjects',
      description: 'Add subjects and define grading limits.',
      icon: BookOpen,
      href: '/subjects',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Teachers',
      description: 'Assign teachers to subjects and classes.',
      icon: GraduationCap,
      href: '/teachers',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Reports',
      description: 'Review academic performance and class reports.',
      icon: FileText,
      href: '/reports',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Credentials',
      description: 'Generate and manage login credentials.',
      icon: Key,
      href: '/credentials',
      color: 'bg-amber-100 text-amber-700',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Overview of the academic management system"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {adminSections.map((section) => (
          <button
            key={section.title}
            onClick={() => navigate(section.href)}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-center hover:bg-gray-50 transition-colors"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.color}`}>
              <section.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-800">{section.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Teachers</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalTeachers}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Subjects</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalSubjects}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Performance</CardTitle>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{averagePerformance}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStudents.length > 0 ? (
                    recentStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No students added
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Average Score by Subject</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {pieData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-gray-500">
                No marks data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
