import { useEffect, useMemo, useState } from 'react';
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

// Ordered exam type codes — determines column order in the table
const EXAM_ORDER = ['MIDTERM', 'FINAL', 'ASSIGNMENT', 'QUIZ'];

// Max marks per exam type (out of subject.maxMarks, scaled by weightage)
function getExamMax(examType, subjectMaxMarks) {
  const total = Number(subjectMaxMarks || 100);
  const w = Number(examType?.weightage || 0);
  return Math.round((w / 100) * total);
}

// Weighted total: sum of (obtained / examMax * weightage) for each exam type
function calcWeightedTotal(rowState, examTypes, subjectMaxMarks) {
  let total = 0;
  for (const et of examTypes) {
    const val = rowState?.[et.id]?.marksObtained;
    if (val === '' || val === undefined) continue;
    const obtained = Number(val);
    const examMax = getExamMax(et, subjectMaxMarks);
    if (examMax > 0 && !Number.isNaN(obtained)) {
      total += (obtained / examMax) * Number(et.weightage || 0);
    }
  }
  return Math.min(total, 100);
}

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
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  // marksByStudentId: { [studentId]: { [examTypeId]: { marksObtained, markId } } }
  const [marksByStudentId, setMarksByStudentId] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sort exam types by preferred order
  const orderedExamTypes = useMemo(() => {
    if (!examTypes?.length) return [];
    const sorted = [...examTypes].sort((a, b) => {
      const ai = EXAM_ORDER.indexOf(a.code?.toUpperCase());
      const bi = EXAM_ORDER.indexOf(b.code?.toUpperCase());
      const aIdx = ai === -1 ? 99 : ai;
      const bIdx = bi === -1 ? 99 : bi;
      return aIdx - bIdx;
    });
    return sorted;
  }, [examTypes]);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && assignedClasses.length > 0) {
      setSelectedClassId(String(assignedClasses[0].id));
    }
  }, [assignedClasses, selectedClassId]);

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

  // Build lookup: { studentId: { examTypeId: mark } }
  const existingMarksLookup = useMemo(() => {
    const lookup = {};
    marks.forEach((mark) => {
      if (
        String(mark.classId) === String(selectedClassId) &&
        String(mark.subjectId) === String(currentTeacher?.subjectId || '') &&
        String(mark.academicYearId || '') === String(selectedAcademicYearId || '')
      ) {
        const sid = String(mark.studentId);
        const etid = String(mark.examTypeId);
        if (!lookup[sid]) lookup[sid] = {};
        lookup[sid][etid] = mark;
      }
    });
    return lookup;
  }, [marks, selectedClassId, currentTeacher?.subjectId, selectedAcademicYearId]);

  // Sync state when class/year/students change
  useEffect(() => {
    const nextState = {};
    studentsInClass.forEach((student) => {
      const sid = String(student.id);
      nextState[sid] = {};
      orderedExamTypes.forEach((et) => {
        const etid = String(et.id);
        const existing = existingMarksLookup[sid]?.[etid];
        nextState[sid][etid] = existing
          ? { marksObtained: String(existing.marks), markId: existing.id }
          : { marksObtained: '', markId: '' };
      });
    });
    setMarksByStudentId(nextState);
  }, [studentsInClass, existingMarksLookup, orderedExamTypes]);

  const handleValueChange = (studentId, examTypeId, value) => {
    setMarksByStudentId((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examTypeId]: {
          ...prev[studentId]?.[examTypeId],
          marksObtained: value,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedAcademicYearId || !assignedSubject) {
      toast.error('Please select class and academic year');
      return;
    }

    const createPayload = [];
    const updatePayload = [];
    let hasAnyEntry = false;
    let validationError = null;

    for (const student of studentsInClass) {
      const sid = String(student.id);
      for (const et of orderedExamTypes) {
        const etid = String(et.id);
        const cell = marksByStudentId[sid]?.[etid] || {};
        const raw = String(cell.marksObtained || '').trim();
        if (raw === '') continue;

        hasAnyEntry = true;
        const obtained = Number(raw);
        const examMax = getExamMax(et, assignedSubject.maxMarks);

        if (Number.isNaN(obtained) || obtained < 0 || obtained > examMax) {
          validationError = `Invalid marks for ${student.firstName} ${student.lastName} — ${et.name} (max ${examMax})`;
          break;
        }

        const payload = {
          studentId: Number(student.id),
          subjectId: Number(assignedSubject.id),
          classId: Number(selectedClassId),
          examTypeId: Number(et.id),
          academicYearId: selectedAcademicYearId ? Number(selectedAcademicYearId) : null,
          marksObtained: obtained,
          maxMarks: examMax,
          grade: buildGrade(obtained, examMax),
          remarks: '',
        };

        if (cell.markId) {
          updatePayload.push({ id: Number(cell.markId), payload });
        } else {
          createPayload.push(payload);
        }
      }
      if (validationError) break;
    }

    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!hasAnyEntry) {
      toast.error('Please enter at least one mark');
      return;
    }

    setSubmitting(true);
    try {
      if (createPayload.length > 0) await addMarks(createPayload);
      for (const item of updatePayload) await updateMark(item.id, item.payload);
      toast.success('Marks saved successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to save marks');
    } finally {
      setSubmitting(false);
    }
  };

  const subjectMaxMarks = Number(assignedSubject?.maxMarks || 100);

  return (
    <div className="space-y-6 pt-4">
      {/* Selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {cls.name} - Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
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

      {/* Weightage legend */}
      {orderedExamTypes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {orderedExamTypes.map((et) => (
            <div key={et.id} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1">
              <span className="font-medium">{et.name}</span>
              <span className="text-gray-400">·</span>
              <span>{et.weightage}% weight · max {getExamMax(et, subjectMaxMarks)} pts</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-full px-3 py-1 font-medium">
            Total = 100%
          </div>
        </div>
      )}

      {/* Marks table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Student Marks</CardTitle>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {submitting ? 'Saving...' : 'Save Marks'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Student</TableHead>
                  {orderedExamTypes.map((et) => (
                    <TableHead key={et.id} className="min-w-[110px] text-center">
                      <div>{et.name}</div>
                      <div className="text-xs font-normal text-gray-400">
                        / {getExamMax(et, subjectMaxMarks)} pts
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[90px] text-center">Total %</TableHead>
                  <TableHead className="min-w-[60px] text-center">Grade</TableHead>
                  <TableHead className="min-w-[70px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length > 0 ? (
                  studentsInClass.map((student) => {
                    const sid = String(student.id);
                    const rowState = marksByStudentId[sid] || {};
                    const weightedTotal = calcWeightedTotal(rowState, orderedExamTypes, subjectMaxMarks);
                    const hasAnyValue = orderedExamTypes.some(
                      (et) => String(rowState[et.id]?.marksObtained || '').trim() !== ''
                    );
                    const hasSaved = orderedExamTypes.some((et) => rowState[et.id]?.markId);
                    const grade = hasAnyValue ? buildGrade(weightedTotal, 100) : '—';

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-gray-400">{student.admissionNumber || ''}</div>
                        </TableCell>
                        {orderedExamTypes.map((et) => {
                          const etid = String(et.id);
                          const cell = rowState[etid] || {};
                          const examMax = getExamMax(et, subjectMaxMarks);
                          const val = cell.marksObtained ?? '';
                          const num = Number(val);
                          const isInvalid = val !== '' && (Number.isNaN(num) || num < 0 || num > examMax);

                          return (
                            <TableCell key={et.id} className="text-center">
                              <Input
                                type="number"
                                min="0"
                                max={examMax}
                                value={val}
                                onChange={(e) => handleValueChange(sid, etid, e.target.value)}
                                placeholder="—"
                                className={`w-20 mx-auto text-center ${isInvalid ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                              />
                              {isInvalid && (
                                <div className="text-xs text-red-500 mt-0.5">max {examMax}</div>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold">
                          {hasAnyValue ? `${weightedTotal.toFixed(1)}%` : '—'}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-green-600">
                          {grade}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasSaved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Saved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              New
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={orderedExamTypes.length + 4} className="py-8 text-center text-gray-500">
                      {selectedClassId ? 'No students found in this class' : 'Please select a class first'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="outline" onClick={() => navigate('/marks')}>
          Open full Marks page
        </Button>
      </div>
    </div>
  );
}
