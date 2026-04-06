import React, { useMemo, useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, School, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx';
import { useData } from '../../contexts/DataContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import { Input } from '../ui/input.jsx';
import { toast } from '../ui/sonner.jsx';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.jsx';
import api from '../../services/api.js';

const EXAM_CATEGORIES = [
  { code: 'QUIZ', label: 'Quiz /10', max: 10 },
  { code: 'MIDTERM', label: 'Mid /30', max: 30 },
  { code: 'FINAL', label: 'Final /50', max: 50 },
  { code: 'ASSIGNMENT', label: 'Assignment /10', max: 10 },
];

function computeTotal(studentMarks) {
  const quiz = Number(studentMarks?.QUIZ || 0);
  const mid = Number(studentMarks?.MIDTERM || 0);
  const final = Number(studentMarks?.FINAL || 0);
  const assignment = Number(studentMarks?.ASSIGNMENT || 0);
  return quiz + mid + final + assignment;
}

function computeGrade(total) {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  if (total >= 50) return 'E';
  return 'F';
}

export function TeacherDashboard() {
  const { students, teachers, classes, marks, examTypes, academicYears, addMarks, updateMark, loading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Quick Marks Entry state
  const [quickMarks, setQuickMarks] = useState({});
  const [quickAssignments, setQuickAssignments] = useState([]);
  const [quickAcademicYearId, setQuickAcademicYearId] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

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

  useEffect(() => {
    if (!selectedClassId) return;
    const hasSelectedClass = assignedClasses.some((classItem) => classItem.id === selectedClassId);
    if (!hasSelectedClass) {
      setSelectedClassId('');
    }
  }, [assignedClasses, selectedClassId]);

  // Load assignments on mount
  useEffect(() => {
    api.getMyAssignments()
      .then((result) => {
        const data = Array.isArray(result) ? result : (result?.assignments || result?.data || []);
        setQuickAssignments(data);
      })
      .catch(() => setQuickAssignments([]));
  }, []);

  // Default academic year to active
  useEffect(() => {
    if (!quickAcademicYearId && academicYears.length > 0) {
      const active = academicYears.find((y) => y.isActive);
      if (active) setQuickAcademicYearId(active.id);
    }
  }, [academicYears, quickAcademicYearId]);

  // Populate quickMarks from existing marks when deps change
  useEffect(() => {
    if (!activeClassId || assignedStudents.length === 0) return;

    const assignment = quickAssignments.find(
      (a) => String(a.classId ?? a.class_id) === String(activeClassId)
    );
    const subjectId = assignment
      ? String(assignment.subjectId ?? assignment.subject_id)
      : currentTeacher?.subjectId
        ? String(currentTeacher.subjectId)
        : null;

    const next = {};
    assignedStudents.forEach((student) => {
      const studentEntry = {};
      EXAM_CATEGORIES.forEach(({ code }) => {
        const examType = examTypes.find((et) => et.code === code);
        const existing = examType
          ? marks.find(
              (m) =>
                String(m.studentId) === String(student.id) &&
                String(m.classId) === String(activeClassId) &&
                String(m.examTypeId) === String(examType.id) &&
                (subjectId ? String(m.subjectId) === subjectId : true)
            )
          : null;
        studentEntry[code] = existing ? String(existing.marks) : '';
        studentEntry[`${code}_markId`] = existing ? existing.id : null;
      });
      next[student.id] = studentEntry;
    });
    setQuickMarks(next);
  }, [activeClassId, assignedStudents, marks, examTypes, quickAssignments, currentTeacher?.subjectId]);

  const quickAssignment = useMemo(
    () => quickAssignments.find((a) => String(a.classId ?? a.class_id) === String(activeClassId)),
    [quickAssignments, activeClassId]
  );

  const quickSubjectId = quickAssignment
    ? String(quickAssignment.subjectId ?? quickAssignment.subject_id)
    : currentTeacher?.subjectId
      ? String(currentTeacher.subjectId)
      : null;

  const handleQuickMarkChange = (studentId, code, value) => {
    setQuickMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [code]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!activeClassId || !quickAcademicYearId || !quickSubjectId) {
      toast.error('Select a class and academic year first');
      return;
    }

    setQuickSubmitting(true);
    try {
      const createPayload = [];
      const updatePayload = [];

      assignedStudents.forEach((student) => {
        const studentEntry = quickMarks[student.id] || {};
        EXAM_CATEGORIES.forEach(({ code, max }) => {
          const value = studentEntry[code];
          if (value === '' || value === undefined || value === null) return;
          const num = Number(value);
          if (Number.isNaN(num) || num < 0 || num > max) return;

          const examType = examTypes.find((et) => et.code === code);
          if (!examType) return;

          const payload = {
            studentId: student.id,
            subjectId: quickSubjectId,
            classId: activeClassId,
            examTypeId: examType.id,
            academicYearId: quickAcademicYearId,
            marksObtained: num,
            maxMarks: max,
            grade: computeGrade((num / max) * 100),
            remarks: '',
          };

          const markId = studentEntry[`${code}_markId`];
          if (markId) {
            updatePayload.push({ id: markId, payload });
          } else {
            createPayload.push(payload);
          }
        });
      });

      if (createPayload.length === 0 && updatePayload.length === 0) {
        toast.error('Enter at least one mark before saving');
        return;
      }

      if (createPayload.length > 0) {
        await addMarks(createPayload);
      }
      for (const item of updatePayload) {
        await updateMark(item.id, item.payload);
      }

      toast.success('Marks saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setQuickSubmitting(false);
    }
  };

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
                <Select value={activeClassId || ""} onValueChange={setSelectedClassId}>
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

          {/* Quick Marks Entry */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg font-semibold">Quick Marks Entry</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={activeClassId || ""} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="w-[180px]">
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
                <Select value={quickAcademicYearId || ""} onValueChange={setQuickAcademicYearId}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.year} - {y.semester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveAll}
                  disabled={quickSubmitting}
                >
                  <Save className="mr-1 h-4 w-4" />
                  {quickSubmitting ? 'Saving...' : 'Save All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!quickSubjectId ? (
                <p className="text-sm text-gray-500 py-4">No subject assigned for this class.</p>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        {EXAM_CATEGORIES.map(({ code, label }) => (
                          <TableHead key={code}>{label}</TableHead>
                        ))}
                        <TableHead>Total /100</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedStudents.length > 0 ? (
                        assignedStudents.map((student) => {
                          const entry = quickMarks[student.id] || {};
                          const total = computeTotal(entry);
                          const grade = computeGrade(total);
                          return (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {student.firstName} {student.lastName}
                              </TableCell>
                              {EXAM_CATEGORIES.map(({ code, max }) => (
                                <TableCell key={code}>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={max}
                                    className="w-16"
                                    value={entry[code] ?? ''}
                                    onChange={(e) => handleQuickMarkChange(student.id, code, e.target.value)}
                                    placeholder="0"
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Badge
                                  className={
                                    total >= 50
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : 'bg-red-100 text-red-700 border-red-200'
                                  }
                                  variant="outline"
                                >
                                  {total}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">{grade}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                            No students found for the selected class.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
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
