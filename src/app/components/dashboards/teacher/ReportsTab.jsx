import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, ArrowUp, ArrowDown, Users } from 'lucide-react';
import { buildGrade } from '../../../utils/buildGrade.js';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Badge } from '../../../components/ui/badge.jsx';
import { Label } from '../../../components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.jsx';

export function ReportsTab({ assignedClasses, classStudents, teacherMarks, assignedSubject }) {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(String(assignedClasses[0].id));
    }
  }, [assignedClasses, selectedClassId]);

  const maxMarks = Number(assignedSubject?.maxMarks || 100);

  const { studentsWithMarks, classAverage, highest, lowest, passRate } = useMemo(() => {
    const studentsInClass = classStudents.filter(
      (s) => String(s.classId) === String(selectedClassId)
    );
    const marksForClass = teacherMarks.filter(
      (m) => String(m.classId) === String(selectedClassId)
    );

    if (marksForClass.length === 0) {
      return { studentsWithMarks: [], classAverage: 0, highest: 0, lowest: 0, passRate: 0 };
    }

    const withMarks = studentsInClass
      .map((student) => {
        const studentMarks = marksForClass.filter(
          (m) => String(m.studentId) === String(student.id)
        );
        if (studentMarks.length === 0) return null;
        // Use the most recent mark entry
        const mark = studentMarks[studentMarks.length - 1];
        const obtained = Number(mark.marks ?? mark.marksObtained ?? 0);
        const pct = (obtained / maxMarks) * 100;
        return { student, obtained, pct, grade: buildGrade(obtained, maxMarks) };
      })
      .filter(Boolean);

    if (withMarks.length === 0) {
      return { studentsWithMarks: [], classAverage: 0, highest: 0, lowest: 0, passRate: 0 };
    }

    const pcts = withMarks.map((r) => r.pct);
    const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const high = Math.max(...pcts);
    const low = Math.min(...pcts);
    const passing = withMarks.filter((r) => r.pct >= 50).length;
    const pass = (passing / withMarks.length) * 100;

    return {
      studentsWithMarks: withMarks,
      classAverage: avg,
      highest: high,
      lowest: low,
      passRate: pass,
    };
  }, [selectedClassId, classStudents, teacherMarks, maxMarks]);

  const hasMarks = studentsWithMarks.length > 0;

  return (
    <div className="space-y-6 pt-4">
      {/* Class selector */}
      <div className="flex items-center gap-4">
        <div className="space-y-2 w-64">
          <Label>Class</Label>
          <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {assignedClasses.map((cls) => (
                <SelectItem key={cls.id} value={String(cls.id)}>
                  {cls.name} - Grade {cls.grade}
                  {cls.section ? ` (${cls.section})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average %</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {hasMarks ? classAverage.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Highest %</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {hasMarks ? highest.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lowest %</CardTitle>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {hasMarks ? lowest.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pass Rate %</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {hasMarks ? passRate.toFixed(1) : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-student table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {hasMarks ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithMarks.map(({ student, obtained, pct, grade }) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        {obtained} / {maxMarks}
                      </TableCell>
                      <TableCell className="font-medium">{grade}</TableCell>
                      <TableCell>
                        {pct >= 50 ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                            Pass
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                            Fail
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">
              No marks data available for this class.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/reports')}>
          View Full Report
        </Button>
      </div>
    </div>
  );
}
