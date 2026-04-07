import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.jsx';

export function OverviewTab({ assignedClasses = [], classStudents = [], teacherMarks = [] }) {
  // Compute per-class average percentage
  const classPerformance = assignedClasses.map((classItem) => {
    const classMarks = teacherMarks.filter(
      (m) => String(m.classId) === String(classItem.id)
    );
    let percentage = 0;
    if (classMarks.length > 0) {
      const totalMarks = classMarks.reduce((sum, m) => sum + (m.marks ?? 0), 0);
      const totalMax = classMarks.reduce((sum, m) => sum + (m.maxMarks ?? 0), 0);
      percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
    }
    return { classItem, percentage };
  });

  // Most recent 5 marks sorted by examDate desc, fallback to id desc
  const recentMarks = [...teacherMarks]
    .sort((a, b) => {
      if (a.examDate && b.examDate) {
        const diff = new Date(b.examDate) - new Date(a.examDate);
        if (diff !== 0) return diff;
      }
      return Number(b.id) - Number(a.id);
    })
    .slice(0, 5);

  // Resolve student name from classStudents
  const resolveStudentName = (studentId) => {
    const student = classStudents.find(
      (s) => String(s.id) === String(studentId)
    );
    if (!student) return '—';
    return [student.firstName, student.lastName].filter(Boolean).join(' ') || '—';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Class Performance */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Class Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedClasses.length === 0 ? (
            <p className="text-sm text-gray-500">No classes assigned.</p>
          ) : (
            <div className="space-y-4">
              {classPerformance.map(({ classItem, percentage }) => (
                <div key={classItem.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{classItem.name}</span>
                    <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Marks */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Marks</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherMarks.length === 0 ? (
            <p className="text-sm text-gray-500">No marks entered yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMarks.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{resolveStudentName(m.studentId)}</TableCell>
                    <TableCell>{m.marks ?? '—'}</TableCell>
                    <TableCell>{m.grade ?? '—'}</TableCell>
                    <TableCell>{formatDate(m.examDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
