import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.jsx';
import { Label } from '../../../components/ui/label.jsx';

export function StudentsTab({ assignedClasses = [], classStudents = [], teacherMarks = [] }) {
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    if (assignedClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(String(assignedClasses[0].id));
    }
  }, [assignedClasses, selectedClassId]);

  const filteredStudents = classStudents.filter(
    (s) => String(s.classId) === String(selectedClassId)
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-semibold">Students</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="students-class-select" className="text-sm whitespace-nowrap">
              Filter by class
            </Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="students-class-select" className="w-48">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map((cls) => (
                  <SelectItem key={cls.id} value={String(cls.id)}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {selectedClassId ? 'No students in this class.' : 'Select a class to view students.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Roll #</TableHead>
                  <TableHead>Marks Entered</TableHead>
                  <TableHead>Performance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const studentMarks = teacherMarks.filter(
                    (m) => String(m.studentId) === String(student.id)
                  );
                  const marksCount = studentMarks.length;

                  let performance = '—';
                  if (marksCount > 0) {
                    const sumMarks = studentMarks.reduce((acc, m) => acc + Number(m.marks ?? 0), 0);
                    const sumMax = studentMarks.reduce((acc, m) => acc + Number(m.maxMarks ?? 0), 0);
                    if (sumMax > 0) {
                      performance = `${((sumMarks / sumMax) * 100).toFixed(1)}%`;
                    }
                  }

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.admissionNumber || '—'}</TableCell>
                      <TableCell>{student.rollNumber || '—'}</TableCell>
                      <TableCell>{marksCount}</TableCell>
                      <TableCell>{performance}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
