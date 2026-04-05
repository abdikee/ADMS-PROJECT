import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Save, AlertCircle, ShieldCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { toast } from '../components/ui/sonner.jsx';

const initialFormData = {
  studentId: '',
  classId: '',
  examTypeId: '',
  academicYearId: '',
  teacherId: '',
  examDate: new Date().toISOString().split('T')[0],
  entries: {},
};

export function MarksPage() {
  const { user } = useAuth();
  const { students, subjects, addMarks, teachers, classes, examTypes, academicYears } = useData();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isTeacher = user?.role === 'Teacher';

  if (!isTeacher) {
    return <Navigate to="/" replace />;
  }

  const currentTeacher = isTeacher ? teachers.find((teacher) => teacher.id === user?.id) : null;
  const teacherClassIds = currentTeacher?.assignedClassIds || (currentTeacher?.assignedClassId ? [currentTeacher.assignedClassId] : []);
  const requestedClassId = searchParams.get('classId') || '';

  const availableClasses = useMemo(() => {
    if (!isTeacher) return classes;
    return classes.filter((cls) => teacherClassIds.includes(cls.id));
  }, [classes, isTeacher, teacherClassIds]);

  const availableSubjects = useMemo(() => {
    if (!isTeacher || !currentTeacher?.subjectId) return subjects;
    return subjects.filter((subject) => subject.id === currentTeacher.subjectId);
  }, [currentTeacher?.subjectId, isTeacher, subjects]);

  const filteredStudents = useMemo(() => {
    if (formData.classId) {
      return students.filter((student) => String(student.classId) === formData.classId);
    }
    if (isTeacher) {
      return students.filter((student) => teacherClassIds.includes(String(student.classId)));
    }
    return students;
  }, [formData.classId, isTeacher, students, teacherClassIds]);

  const selectedClass = availableClasses.find((cls) => cls.id === formData.classId) || null;
  const selectedStudent = students.find((student) => student.id === formData.studentId);

  useEffect(() => {
    if (availableSubjects.length === 0) return;

    const initialEntries = {};
    availableSubjects.forEach((subject) => {
      initialEntries[subject.id] = {
        subjectId: subject.id,
        marksObtained: 0,
        maxMarks: subject.maxMarks || 100,
        grade: '',
        remarks: '',
      };
    });

    setFormData((prev) => ({ ...prev, entries: initialEntries }));
  }, [availableSubjects]);

  useEffect(() => {
    if (!isTeacher || !currentTeacher) return;

    const queryClassId = requestedClassId && teacherClassIds.includes(requestedClassId)
      ? requestedClassId
      : '';
    const defaultClassId = formData.classId && teacherClassIds.includes(formData.classId)
      ? formData.classId
      : queryClassId || availableClasses[0]?.id || '';
    const selectedClassItem = availableClasses.find((cls) => cls.id === defaultClassId);

    setFormData((prev) => ({
      ...prev,
      classId: defaultClassId,
      teacherId: currentTeacher.id,
      academicYearId: selectedClassItem?.academicYearId || prev.academicYearId,
    }));
  }, [availableClasses, currentTeacher, isTeacher, requestedClassId, teacherClassIds]);

  useEffect(() => {
    if (!formData.classId) return;

    setFormData((prev) => {
      const hasSelectedStudent = filteredStudents.some((student) => student.id === prev.studentId);
      if (hasSelectedStudent) return prev;
      return { ...prev, studentId: filteredStudents[0]?.id || '' };
    });
  }, [filteredStudents, formData.classId]);

  const handleMarksChange = (subjectId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [subjectId]: { ...prev.entries[subjectId], [field]: value },
      },
    }));

    if (errors[subjectId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[subjectId];
        return next;
      });
    }
  };

  const validateMarks = (marks, maxMarks) => {
    if (marks < 0) return 'Marks cannot be negative';
    if (marks > maxMarks) return `Marks cannot exceed ${maxMarks}`;
    return null;
  };

  const calculateGrade = (marks, maxMarks) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  };

  const handleMarksInputChange = (subjectId, value) => {
    const numValue = parseFloat(value) || 0;
    const maxMarks = formData.entries[subjectId]?.maxMarks || 100;
    const error = validateMarks(numValue, maxMarks);

    if (error) {
      setErrors((prev) => ({ ...prev, [subjectId]: error }));
    }

    handleMarksChange(subjectId, 'marksObtained', numValue);
    handleMarksChange(subjectId, 'grade', calculateGrade(numValue, maxMarks));
  };

  const validateForm = () => {
    if (!formData.classId) { toast.error('Please select a class'); return false; }
    if (!formData.studentId) { toast.error('Please select a student'); return false; }
    if (!formData.examTypeId) { toast.error('Please select an exam type'); return false; }
    if (!formData.examDate) { toast.error('Please select an exam date'); return false; }
    if (Object.keys(errors).length > 0) { toast.error('Please fix validation errors'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const marksArray = Object.values(formData.entries).map((entry) => ({
      studentId: formData.studentId,
      subjectId: entry.subjectId,
      classId: parseInt(formData.classId, 10),
      examTypeId: parseInt(formData.examTypeId, 10),
      academicYearId: formData.academicYearId ? parseInt(formData.academicYearId, 10) : undefined,
      marksObtained: entry.marksObtained,
      maxMarks: entry.maxMarks,
      grade: entry.grade,
      remarks: entry.remarks,
      teacherId: formData.teacherId ? parseInt(formData.teacherId, 10) : undefined,
      examDate: formData.examDate,
    }));

    const validMarks = marksArray.filter((mark) => mark.marksObtained > 0);

    if (validMarks.length === 0) {
      toast.error('Please enter marks for at least one subject');
      return;
    }

    try {
      await addMarks(validMarks);
      toast.success('Marks saved successfully');
      const defaultClass = isTeacher ? (availableClasses[0]?.id || '') : '';
      const defaultClassInfo = availableClasses.find((cls) => cls.id === defaultClass);
      setFormData({
        ...initialFormData,
        classId: defaultClass,
        teacherId: isTeacher ? (currentTeacher?.id || '') : '',
        academicYearId: isTeacher ? (defaultClassInfo?.academicYearId || '') : '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to save marks');
    }
  };

  const getTotalMarks = () => Object.values(formData.entries).reduce((sum, entry) => sum + (entry.marksObtained || 0), 0);
  const getTotalMaxMarks = () => Object.values(formData.entries).reduce((sum, entry) => sum + (entry.maxMarks || 100), 0);
  const getAverage = () => {
    const entries = Object.values(formData.entries);
    if (entries.length === 0) return '0.00';
    const totalPercentage = entries.reduce((sum, entry) => sum + ((entry.marksObtained || 0) / (entry.maxMarks || 100)) * 100, 0);
    return (totalPercentage / entries.length).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Marks Entry</h2>
        <p className="text-gray-600 mt-1">
          Teachers can grade only their assigned subject across their assigned classes and exam types.
        </p>
      </div>

      <Card className="border-gray-200 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Enter Student Marks</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {isTeacher && currentTeacher && (
              <Alert className="bg-blue-50 border-blue-200">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You can only grade <strong>{currentTeacher.subjectName}</strong> for
                  {' '}
                  <strong>{(currentTeacher.assignedClassNames || []).join(', ') || currentTeacher.assignedClassName}</strong>.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => {
                    const selectedClassItem = availableClasses.find((cls) => cls.id === value);
                    setFormData((prev) => ({
                      ...prev,
                      classId: value,
                      studentId: '',
                      academicYearId: selectedClassItem?.academicYearId || prev.academicYearId,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - Grade {cls.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Select Student *</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, studentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} - {student.rollNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.classId && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Registered Students
                      {selectedClass ? ` - ${selectedClass.name}` : ''}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredStudents.length > 0
                        ? 'Students registered under the selected class appear here and are ready for mark entry.'
                        : 'No students are currently registered under the selected class.'}
                    </p>
                  </div>
                  <div className="rounded-md bg-white border border-gray-200 px-3 py-2 text-right">
                    <p className="text-xs text-gray-500">Student Count</p>
                    <p className="text-xl font-bold text-gray-900">{filteredStudents.length}</p>
                  </div>
                </div>

                {filteredStudents.length > 0 && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {filteredStudents.map((student) => {
                      const isActiveStudent = student.id === formData.studentId;
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, studentId: student.id }))}
                          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                            isActiveStudent
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 bg-white hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500">
                            Roll: {student.rollNumber || '-'} | Admission: {student.admissionNumber || '-'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type *</Label>
                <Select value={formData.examTypeId} onValueChange={(value) => setFormData({ ...formData, examTypeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((examType) => (
                      <SelectItem key={examType.id} value={examType.id}>
                        {examType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select value={formData.academicYearId} onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year..." />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year} - {year.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date *</Label>
                <Input id="examDate" type="date" value={formData.examDate} onChange={(e) => setFormData({ ...formData, examDate: e.target.value })} />
              </div>
            </div>

            {selectedStudent && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Entering marks for <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong> - Roll: {selectedStudent.rollNumber}
                </AlertDescription>
              </Alert>
            )}

            {formData.studentId && availableSubjects.length > 0 && (
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="font-semibold text-gray-900">Subject Marks</h3>
                  <p className="text-sm text-gray-500">Exam types are graded separately. Select an exam type, then save marks.</p>
                </div>

                <div className="grid gap-4">
                  {availableSubjects.map((subject) => (
                    <div key={subject.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="font-medium">{subject.name}</Label>
                        <p className="text-xs text-gray-500">Code: {subject.code}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`marks-${subject.id}`} className="text-sm">
                          Marks Obtained (Max: {subject.maxMarks || 100})
                        </Label>
                        <Input
                          id={`marks-${subject.id}`}
                          type="number"
                          min="0"
                          max={subject.maxMarks || 100}
                          step="0.01"
                          value={formData.entries[subject.id]?.marksObtained || 0}
                          onChange={(e) => handleMarksInputChange(subject.id, e.target.value)}
                          className={errors[subject.id] ? 'border-red-500' : ''}
                        />
                        {errors[subject.id] && (
                          <p className="text-sm text-red-600">{errors[subject.id]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`grade-${subject.id}`} className="text-sm">Grade</Label>
                        <Input
                          id={`grade-${subject.id}`}
                          value={formData.entries[subject.id]?.grade || ''}
                          onChange={(e) => handleMarksChange(subject.id, 'grade', e.target.value)}
                          placeholder="Auto-calculated"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`remarks-${subject.id}`} className="text-sm">Remarks</Label>
                        <Input
                          id={`remarks-${subject.id}`}
                          value={formData.entries[subject.id]?.remarks || ''}
                          onChange={(e) => handleMarksChange(subject.id, 'remarks', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">Total Marks</p>
                      <p className="text-2xl font-bold text-blue-900">{getTotalMarks()} / {getTotalMaxMarks()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Average</p>
                      <p className="text-2xl font-bold text-blue-900">{getAverage()}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Status</p>
                      <p className={`text-lg font-bold ${parseFloat(getAverage()) >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(getAverage()) >= 40 ? 'Pass' : 'Fail'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({
                      ...initialFormData,
                      classId: isTeacher ? (availableClasses[0]?.id || '') : '',
                      teacherId: isTeacher ? (currentTeacher?.id || '') : '',
                      academicYearId: isTeacher ? (availableClasses[0]?.academicYearId || '') : '',
                    })}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Marks
                  </Button>
                </div>
              </div>
            )}

            {!formData.studentId && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Select a class and student to enter marks</p>
              </div>
            )}

            {formData.studentId && availableSubjects.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No subject assignment found. Assign a subject to the teacher first.</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
