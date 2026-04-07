import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Save, CheckCircle } from 'lucide-react';
import { buildGrade } from '../../../utils/buildGrade.js';
import { Button } from '../../../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Input } from '../../../components/ui/input.jsx';
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
import { Badge } from '../../../components/ui/badge.jsx';
import { toast } from '../../../components/ui/sonner.jsx';

export function MarksTab({
  currentTeacher,
  assignedClasses,
  assignedSubject,
  classStudents,
  marks,
  examTypes,
  academicYears,
  addMarks,
  updateMark,
}) {
  const navigate = useNavigate();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [marksByStudentId, setMarksByStudentId] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(String(assignedClasses[0].id));
    }
  }, [assignedClasses, selectedClassId]);

  // Auto-select first exam type
  useEffect(() => {
    if (!selectedExamTypeId && examTypes.length > 0) {
      setSelectedExamTypeId(String(examTypes[0].id));
    }
  }, [examTypes, selectedExamTypeId]);

  // Auto-select active academic year
  useEffect(() => {
    const activeYear = academicYears.find((y) => y.isActive);
    if (!selectedAcademicYearId && activeYear) {
      setSelectedAcademicYearId(String(activeYear.id));
    }
  }, [academicYears, selectedAcademicYearId]);

  const studentsInClass = useMemo(
    () => classStudents.filter((s) => String(s.classId) === String(selectedClassId)),
    [classStudents, selectedClassId]
  );

  const existingMarksByStudentId = useMemo(() => {
    const lookup = new Map();
    marks.forEach((mark) => {
      if (
        String(mark.classId) === String(selectedClassId) &&
        String(mark.subjectId) === String(currentTeacher?.subjectId || '') &&
        String(mark.examTypeId) === String(selectedExamTypeId) &&
        String(mark.academicYearId || '') === String(selectedAcademicYearId || '')
      ) {
        lookup.set(mark.studentId, mark);
      }
    });
    return lookup;
  }, [marks, selectedClassId, currentTeacher?.subjectId, selectedExamTypeId, selectedAcademicYearId]);

  // Sync marksByStudentId from existingMarksByStudentId when selectors change
  useEffect(() => {
    const nextState = {};
    studentsInClass.forEach((student) => {
      const existingMark = existingMarksByStudentId.get(student.id);
      nextState[student.id] = existingMark
        ? {
            marksObtained: String(existingMark.marks),
            remarks: existingMark.remarks || '',
            markId: existingMark.id,
          }
        : {
            marksObtained: '',
            remarks: '',
            markId: '',
          };
    });
    setMarksByStudentId(nextState);
  }, [studentsInClass, existingMarksByStudentId]);

  const handleValueChange = (studentId, key, value) => {
    setMarksByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedExamTypeId || !selectedAcademicYearId || !assignedSubject) {
      toast.error('Please select all required fields');
      return;
    }

    const entries = studentsInClass
      .map((student) => ({
        student,
        values: marksByStudentId[student.id] || {},
      }))
      .filter(({ values }) => String(values.marksObtained || '').trim() !== '');

    if (entries.length === 0) {
      toast.error('Please enter at least one mark');
      return;
    }

    const maxMarks = Number(assignedSubject.maxMarks || 100);
    const invalidEntry = entries.find(({ values }) => {
      const num = Number(values.marksObtained);
      return Number.isNaN(num) || num < 0 || num > maxMarks;
    });

    if (invalidEntry) {
      toast.error(
        `Invalid marks for ${invalidEntry.student.firstName} ${invalidEntry.student.lastName}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const createPayload = [];
      const updatePayload = [];

      entries.forEach(({ student, values }) => {
        const marksObtained = Number(values.marksObtained);
        const payload = {
          studentId: Number(student.id),
          subjectId: Number(assignedSubject.id),
          classId: Number(selectedClassId),
          examTypeId: Number(selectedExamTypeId),
          academicYearId: selectedAcademicYearId ? Number(selectedAcademicYearId) : null,
          marksObtained,
          maxMarks,
          grade: buildGrade(marksObtained, maxMarks),
          remarks: values.remarks || '',
        };

        if (values.markId) {
          updatePayload.push({ id: Number(values.markId), payload });
        } else {
          createPayload.push(payload);
        }
      });

      if (createPayload.length > 0) {
        await addMarks(createPayload);
      }
      for (const item of updatePayload) {
        await updateMark(item.id, item.payload);
      }

      toast.success('Marks saved successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save marks');
    } finally {
      setSubmitting(false);
    }
  };

  const maxMarks = Number(assignedSubject?.maxMarks || 100);

  return (
    <div className="space-y-6 pt-4">
      {/* Selector grid */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm font-medium">
                {assignedSubject?.name || 'No subject assigned'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
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
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select value={selectedExamTypeId || ''} onValueChange={setSelectedExamTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((et) => (
                    <SelectItem key={et.id} value={String(et.id)}>
                      {et.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Select value={selectedAcademicYearId || ''} onValueChange={setSelectedAcademicYearId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((ay) => (
                    <SelectItem key={ay.id} value={String(ay.id)}>
                      {ay.year} - {ay.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length > 0 ? (
                  studentsInClass.map((student) => {
                    const rowState = marksByStudentId[student.id] || {};
                    const hasValue = String(rowState.marksObtained || '').trim() !== '';
                    const numericMarks = Number(rowState.marksObtained);
                    const grade =
                      hasValue && !Number.isNaN(numericMarks)
                        ? buildGrade(numericMarks, maxMarks)
                        : '-';

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.admissionNumber || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={rowState.marksObtained || ''}
                              onChange={(e) =>
                                handleValueChange(student.id, 'marksObtained', e.target.value)
                              }
                              placeholder="0"
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">/ {maxMarks}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">{grade}</TableCell>
                        <TableCell>
                          <Input
                            value={rowState.remarks || ''}
                            onChange={(e) =>
                              handleValueChange(student.id, 'remarks', e.target.value)
                            }
                            placeholder="Remarks"
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {rowState.markId ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Saved
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-600 border-gray-200"
                            >
                              New
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                      {selectedClassId
                        ? 'No students found in this class'
                        : 'Please select a class first'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/marks')}>
          Open full Marks page
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {submitting ? 'Saving...' : 'Save Marks'}
        </Button>
      </div>
    </div>
  );
}
