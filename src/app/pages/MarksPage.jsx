import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Navigate } from 'react-router';
import { Save, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { getTeacherAssignedClassIds } from '../utils/teacherAssignments.js';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { toast } from '../components/ui/sonner.jsx';

function buildGrade(marksObtained, maxMarks) {
  if (!maxMarks || maxMarks <= 0) {
    return '';
  }

  const percentage = (Number(marksObtained) / Number(maxMarks)) * 100;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}

export function MarksPage() {
  const { user } = useAuth();
  const {
    teachers,
    classes,
    students,
    subjects,
    examTypes,
    academicYears,
    marks,
    addMarks,
    updateMark,
  } = useData();

  if (user?.role !== 'Teacher') {
    return <Navigate to="/" replace />;
  }

  const currentTeacher = teachers.find((teacher) => teacher.id === user.id) || null;
  const assignedClassIds = useMemo(
    () => getTeacherAssignedClassIds(currentTeacher, classes),
    [currentTeacher, classes]
  );
  const availableClasses = useMemo(
    () => classes.filter((classItem) => assignedClassIds.includes(classItem.id)),
    [classes, assignedClassIds]
  );

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [marksByStudentId, setMarksByStudentId] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bulkMarksValue, setBulkMarksValue] = useState('');
  const [bulkRemarksValue, setBulkRemarksValue] = useState('');
  const inputRefs = useRef({});

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === currentTeacher?.subjectId) || null,
    [subjects, currentTeacher?.subjectId]
  );

  useEffect(() => {
    if (!selectedClassId && availableClasses.length > 0) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  useEffect(() => {
    if (!selectedExamTypeId && examTypes.length > 0) {
      setSelectedExamTypeId(examTypes[0].id);
    }
  }, [examTypes, selectedExamTypeId]);

  useEffect(() => {
    const activeAcademicYear = academicYears.find((year) => year.isActive);
    if (!selectedAcademicYearId && activeAcademicYear) {
      setSelectedAcademicYearId(activeAcademicYear.id);
    }
  }, [academicYears, selectedAcademicYearId]);

  const classStudents = useMemo(
    () => students.filter((student) => String(student.classId) === String(selectedClassId)),
    [students, selectedClassId]
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

  useEffect(() => {
    const nextState = {};
    classStudents.forEach((student) => {
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
  }, [classStudents, existingMarksByStudentId]);

  const handleValueChange = (studentId, key, value) => {
    setMarksByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [key]: value,
      },
    }));
  };

  const handleKeyDown = (event, studentId, currentIndex) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const studentIds = classStudents.map(s => s.id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < studentIds.length) {
        const nextStudentId = studentIds[nextIndex];
        const nextInput = inputRefs.current[`${nextStudentId}-marks`];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  const handleBulkFillMarks = () => {
    if (!bulkMarksValue.trim()) return;
    const numericValue = Number(bulkMarksValue);
    const maxMarks = Number(selectedSubject?.maxMarks || 100);
    
    if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > maxMarks) {
      toast.error(`Invalid marks value. Must be between 0 and ${maxMarks}`);
      return;
    }

    setMarksByStudentId((prev) => {
      const updated = { ...prev };
      classStudents.forEach((student) => {
        if (!updated[student.id]) {
          updated[student.id] = { marksObtained: '', remarks: '', markId: '' };
        }
        updated[student.id].marksObtained = String(numericValue);
      });
      return updated;
    });
    toast.success(`Applied ${numericValue} marks to all students`);
  };

  const handleBulkFillRemarks = () => {
    if (!bulkRemarksValue.trim()) return;
    
    setMarksByStudentId((prev) => {
      const updated = { ...prev };
      classStudents.forEach((student) => {
        if (!updated[student.id]) {
          updated[student.id] = { marksObtained: '', remarks: '', markId: '' };
        }
        updated[student.id].remarks = bulkRemarksValue;
      });
      return updated;
    });
    toast.success('Applied remarks to all students');
  };

  const handleClearAll = () => {
    setMarksByStudentId((prev) => {
      const updated = { ...prev };
      classStudents.forEach((student) => {
        updated[student.id] = { marksObtained: '', remarks: '', markId: '' };
      });
      return updated;
    });
    setBulkMarksValue('');
    setBulkRemarksValue('');
    toast.success('Cleared all marks');
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedExamTypeId || !selectedAcademicYearId || !selectedSubject) {
      toast.error('Select class, exam type, academic year, and subject first');
      return;
    }

    const entries = classStudents
      .map((student) => ({
        student,
        values: marksByStudentId[student.id] || {},
      }))
      .filter(({ values }) => String(values.marksObtained || '').trim() !== '');

    if (entries.length === 0) {
      toast.error('Enter at least one mark before saving');
      return;
    }

    const invalidEntry = entries.find(({ values }) => {
      const numericValue = Number(values.marksObtained);
      return Number.isNaN(numericValue) || numericValue < 0 || numericValue > Number(selectedSubject.maxMarks || 100);
    });

    if (invalidEntry) {
      toast.error(`Invalid marks for ${invalidEntry.student.firstName} ${invalidEntry.student.lastName}`);
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
          subjectId: Number(selectedSubject.id),
          classId: Number(selectedClassId),
          examTypeId: Number(selectedExamTypeId),
          academicYearId: selectedAcademicYearId ? Number(selectedAcademicYearId) : null,
          marksObtained,
          maxMarks: Number(selectedSubject.maxMarks || 100),
          grade: buildGrade(marksObtained, selectedSubject.maxMarks || 100),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marks Entry</h2>
          <p className="mt-1 text-gray-600">Record marks only for your assigned subject and classes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClearAll} disabled={submitting}>
            Clear All
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
            <Save className="mr-2 h-4 w-4" />
            {submitting ? 'Saving...' : 'Save Marks'}
          </Button>
        </div>
      </div>

      {/* Bulk Operations */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Fill All Marks</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max={selectedSubject?.maxMarks || 100}
                  value={bulkMarksValue}
                  onChange={(e) => setBulkMarksValue(e.target.value)}
                  placeholder="Enter marks"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleBulkFillMarks} size="sm">
                  Apply
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fill All Remarks</Label>
              <div className="flex gap-2">
                <Input
                  value={bulkRemarksValue}
                  onChange={(e) => setBulkRemarksValue(e.target.value)}
                  placeholder="Enter remarks"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleBulkFillRemarks} size="sm">
                  Apply
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                {selectedSubject?.maxMarks || 100}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Students Count</Label>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                {classStudents.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="grid gap-4 pt-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Subject</Label>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
              {selectedSubject?.name || 'No assigned subject'}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClassId || ""} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name} - Grade {classItem.grade}{classItem.section ? ` (${classItem.section})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Exam Type</Label>
            <Select value={selectedExamTypeId || ""} onValueChange={setSelectedExamTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((examType) => (
                  <SelectItem key={examType.id} value={examType.id}>{examType.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Academic Year</Label>
            <Select value={selectedAcademicYearId || ""} onValueChange={setSelectedAcademicYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((academicYear) => (
                  <SelectItem key={academicYear.id} value={academicYear.id}>
                    {academicYear.year} - {academicYear.semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Class Marks</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.length > 0 ? (
                  classStudents.map((student, index) => {
                    const rowState = marksByStudentId[student.id] || {};
                    const marksObtained = Number(rowState.marksObtained);
                    const maxMarks = Number(selectedSubject?.maxMarks || 100);
                    const hasValue = String(rowState.marksObtained || '').trim() !== '';
                    const grade = hasValue && !Number.isNaN(marksObtained)
                      ? buildGrade(marksObtained, maxMarks)
                      : '-';
                    const isValid = !hasValue || (!Number.isNaN(marksObtained) && marksObtained >= 0 && marksObtained <= maxMarks);

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.admissionNumber || '-'}</TableCell>
                        <TableCell>{maxMarks}</TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input
                              ref={(el) => (inputRefs.current[`${student.id}-marks`] = el)}
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={rowState.marksObtained || ''}
                              onChange={(event) => handleValueChange(student.id, 'marksObtained', event.target.value)}
                              onKeyDown={(event) => handleKeyDown(event, student.id, index)}
                              placeholder="0"
                              className={`w-20 ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {!isValid && (
                              <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${grade !== '-' ? 'text-green-600' : 'text-gray-400'}`}>
                            {grade}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={rowState.remarks || ''}
                            onChange={(event) => handleValueChange(student.id, 'remarks', event.target.value)}
                            placeholder="Optional remarks"
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {rowState.markId ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Existing
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              New
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      No students are available for the selected class.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {classStudents.length > 0 ? (
              classStudents.map((student, index) => {
                const rowState = marksByStudentId[student.id] || {};
                const marksObtained = Number(rowState.marksObtained);
                const maxMarks = Number(selectedSubject?.maxMarks || 100);
                const hasValue = String(rowState.marksObtained || '').trim() !== '';
                const grade = hasValue && !Number.isNaN(marksObtained)
                  ? buildGrade(marksObtained, maxMarks)
                  : '-';
                const isValid = !hasValue || (!Number.isNaN(marksObtained) && marksObtained >= 0 && marksObtained <= maxMarks);

                return (
                  <Card key={student.id} className="border-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{student.firstName} {student.lastName}</h4>
                          <p className="text-sm text-gray-500">Admission: {student.admissionNumber || '-'}</p>
                        </div>
                        {rowState.markId ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Existing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Max Marks</Label>
                          <div className="text-sm font-medium">{maxMarks}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Grade</Label>
                          <div className={`text-sm font-medium ${grade !== '-' ? 'text-green-600' : 'text-gray-400'}`}>
                            {grade}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <Label className="text-sm">Marks Obtained</Label>
                          <div className="relative mt-1">
                            <Input
                              ref={(el) => (inputRefs.current[`${student.id}-marks`] = el)}
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={rowState.marksObtained || ''}
                              onChange={(event) => handleValueChange(student.id, 'marksObtained', event.target.value)}
                              onKeyDown={(event) => handleKeyDown(event, student.id, index)}
                              placeholder="0"
                              className={`w-full ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            />
                            {!isValid && (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Remarks</Label>
                          <Input
                            value={rowState.remarks || ''}
                            onChange={(event) => handleValueChange(student.id, 'remarks', event.target.value)}
                            placeholder="Optional remarks"
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="py-8 text-center text-gray-500">
                No students are available for the selected class.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
