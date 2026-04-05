import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table.jsx';
import { Badge } from '../components/ui/badge.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
import { Label } from '../components/ui/label.jsx';
import { toast } from '../components/ui/sonner.jsx';
import { getTeacherAssignedClassIds } from '../utils/teacherAssignments.js';

function aggregateClassReports(students, marks, subjects, fallbackSubjectIds = []) {
  const subjectIds = Array.from(new Set([
    ...marks.map((mark) => String(mark.subjectId)),
    ...fallbackSubjectIds,
  ]));

  const orderedSubjectIds = subjectIds.sort((left, right) => {
    const leftName = subjects.find((subject) => subject.id === left)?.name || '';
    const rightName = subjects.find((subject) => subject.id === right)?.name || '';
    return leftName.localeCompare(rightName);
  });

  const reports = students.map((student) => {
    const studentMarks = marks.filter((mark) => mark.studentId === student.id);
    const marksWithSubjects = orderedSubjectIds.map((subjectId) => {
      const subject = subjects.find((item) => item.id === subjectId);
      const marksForSubject = studentMarks.filter((mark) => String(mark.subjectId) === subjectId);
      const marksObtained = marksForSubject.reduce((sum, mark) => sum + Number(mark.marks || 0), 0);
      const maxMarks = marksForSubject.reduce((sum, mark) => sum + Number(mark.maxMarks || subject?.maxMarks || 100), 0);
      const percentage = maxMarks > 0 ? ((marksObtained / maxMarks) * 100).toFixed(1) : '0.0';
      return { subjectId, subjectName: subject?.name || 'Unknown', marks: marksObtained, maxMarks, percentage };
    });

    const total = marksWithSubjects.reduce((sum, item) => sum + item.marks, 0);
    const maxTotal = marksWithSubjects.reduce((sum, item) => sum + item.maxMarks, 0);
    const averageValue = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    return {
      student,
      marksWithSubjects,
      total,
      maxTotal,
      average: averageValue.toFixed(1),
      status: averageValue >= 50 ? 'PASS' : 'FAIL',
      rank: 0,
    };
  });

  const sorted = [...reports].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    return parseFloat(right.average) - parseFloat(left.average);
  });

  let currentRank = 0;
  let previousTotal = null;
  const rankByStudentId = new Map();

  sorted.forEach((report, index) => {
    if (previousTotal !== report.total) {
      currentRank = index + 1;
      previousTotal = report.total;
    }
    rankByStudentId.set(report.student.id, currentRank);
  });

  return reports.map((report) => ({ ...report, rank: rankByStudentId.get(report.student.id) || 0 }));
}

function getStudentName(student) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ') || student.name || 'Unknown Student';
}

function getStudentIdentifier(student) {
  return student.admissionNumber || student.rollNumber || student.id || '-';
}

function getGenderLabel(gender) {
  if (!gender) return '-';
  const normalized = gender.toLowerCase();
  if (normalized.startsWith('m')) return 'M';
  if (normalized.startsWith('f')) return 'F';
  return gender.charAt(0).toUpperCase();
}

function getReportCardFileName(className, count) {
  const normalized = (className || 'class-report')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${normalized || 'class-report'}-${count === 1 ? 'report-card' : `${count}-report-cards`}.pdf`;
}

function ReportCard({ report, classInfo, index, totalCards }) {
  const homeroomTeacher = classInfo?.homeroomTeacherName || 'Not Assigned';
  const academicYearLabel = classInfo
    ? `${classInfo.academicYear || '-'} | ${classInfo.semester || '-'}`
    : '-';
  const gradeLabel = classInfo?.grade
    ? `${classInfo.grade}${classInfo.section ? classInfo.section : ''}`
    : (classInfo?.name || report.student.className || '-');

  return (
    <Card
      data-report-card="true"
      className="border-gray-200 overflow-hidden bg-white print:shadow-none print:border-0"
      style={{ breakAfter: index === totalCards - 1 ? 'auto' : 'page' }}
    >
      <CardContent className="p-0">
        <div className="relative p-5 sm:p-6">
          <div className="absolute left-0 top-0 h-0 w-0 border-r-[18px] border-t-[18px] border-r-transparent border-t-green-500" />
          <div className="overflow-hidden border border-gray-200">
            <div className="bg-[#5f97cc] px-4 py-4 text-center text-white">
              <h1 className="text-xl font-bold uppercase">ABC High School Student Report Card</h1>
              <p className="mt-1 text-lg font-semibold uppercase">Grade: {gradeLabel}</p>
              <p className="mt-1 text-base font-semibold uppercase">Homeroom Teacher: {homeroomTeacher}</p>
              <p className="mt-1 text-base font-semibold uppercase">Academic Year: {academicYearLabel}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#d6e1f1] text-left text-gray-900">
                    <th className="border border-white px-3 py-2 font-bold uppercase">Student Name</th>
                    <th className="border border-white px-3 py-2 font-bold uppercase">Gender</th>
                    <th className="border border-white px-3 py-2 font-bold uppercase">ID</th>
                    {report.marksWithSubjects.map((mark) => (
                      <th key={mark.subjectId} className="border border-white px-3 py-2 text-center font-bold uppercase">
                        {mark.subjectName}
                      </th>
                    ))}
                    <th className="border border-white px-3 py-2 text-center font-bold uppercase">Total</th>
                    <th className="border border-white px-3 py-2 text-center font-bold uppercase">Avg</th>
                    <th className="border border-white px-3 py-2 text-center font-bold uppercase">Rank</th>
                    <th className="border border-white px-3 py-2 text-center font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#eaf0f8] text-gray-900">
                    <td className="border border-white px-3 py-3 font-medium">{getStudentName(report.student)}</td>
                    <td className="border border-white px-3 py-3">{getGenderLabel(report.student.gender)}</td>
                    <td className="border border-white px-3 py-3">{getStudentIdentifier(report.student)}</td>
                    {report.marksWithSubjects.map((mark) => (
                      <td key={mark.subjectId} className="border border-white px-3 py-3 text-center">{mark.marks}</td>
                    ))}
                    <td className="border border-white px-3 py-3 text-center font-semibold">{report.total}</td>
                    <td className="border border-white px-3 py-3 text-center font-semibold">{report.average}</td>
                    <td className="border border-white px-3 py-3 text-center font-semibold">{report.rank}</td>
                    <td className={`border border-white px-3 py-3 text-center font-bold text-white ${report.status === 'PASS' ? 'bg-[#00b050]' : 'bg-[#c00000]'}`}>
                      {report.status}
                    </td>
                  </tr>
                  {report.marksWithSubjects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-white px-3 py-8 text-center text-gray-500">
                        No marks are available for this student yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  const { students, subjects, marks, classes, teachers } = useData();
  const { user } = useAuth();
  const reportCardsRef = useRef(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectionMode, setSelectionMode] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  const isTeacher = user?.role === 'Teacher';
  const isStudent = user?.role === 'Student';
  const currentTeacher = isTeacher ? teachers.find((teacher) => teacher.id === user?.id) : null;
  const teacherClassIds = useMemo(
    () => getTeacherAssignedClassIds(currentTeacher, classes),
    [currentTeacher, classes]
  );
  const availableClasses = useMemo(
    () => (isTeacher ? classes.filter((classItem) => teacherClassIds.includes(classItem.id)) : classes),
    [isTeacher, classes, teacherClassIds]
  );

  useEffect(() => {
    if (!availableClasses.length || isStudent) return;
    setSelectedClassId((prev) => (
      prev && availableClasses.some((classItem) => classItem.id === prev)
        ? prev
        : availableClasses[0].id
    ));
  }, [availableClasses, isStudent]);

  const currentStudent = isStudent ? students.find((student) => student.id === user?.id) : null;
  const currentStudentClassId = currentStudent?.classId ? String(currentStudent.classId) : '';
  const activeClassId = isStudent ? currentStudentClassId : selectedClassId;
  const selectedClass = classes.find((classItem) => classItem.id === activeClassId) || null;
  const classStudents = useMemo(
    () => students.filter((student) => String(student.classId) === activeClassId),
    [students, activeClassId]
  );
  const classMarks = useMemo(
    () => marks.filter((mark) => String(mark.classId) === activeClassId),
    [marks, activeClassId]
  );
  const fallbackTeacherSubjectIds = useMemo(
    () => (isTeacher && currentTeacher?.subjectId ? [currentTeacher.subjectId] : []),
    [isTeacher, currentTeacher?.subjectId]
  );

  const classReports = useMemo(
    () => aggregateClassReports(classStudents, classMarks, subjects, fallbackTeacherSubjectIds),
    [classStudents, classMarks, subjects, fallbackTeacherSubjectIds]
  );

  useEffect(() => {
    const availableStudentIds = classReports.map((report) => report.student.id);
    if (availableStudentIds.length === 0) {
      setSelectedStudentId('');
      setSelectedStudentIds([]);
      return;
    }
    setSelectedStudentId((prev) => (availableStudentIds.includes(prev) ? prev : availableStudentIds[0]));
    setSelectedStudentIds((prev) => prev.filter((id) => availableStudentIds.includes(id)));
  }, [classReports]);

  const currentStudentReport = isStudent
    ? classReports.find((report) => report.student.id === user?.id) || null
    : null;

  const visibleSubjects = currentStudentReport?.marksWithSubjects || classReports[0]?.marksWithSubjects || [];

  const reportsToRender = useMemo(() => {
    if (isStudent) return currentStudentReport ? [currentStudentReport] : [];
    if (selectionMode === 'single') return classReports.filter((report) => report.student.id === selectedStudentId);
    if (selectionMode === 'selected') return classReports.filter((report) => selectedStudentIds.includes(report.student.id));
    return classReports;
  }, [classReports, currentStudentReport, isStudent, selectedStudentId, selectedStudentIds, selectionMode]);

  const toggleStudentSelection = (studentId, checked) => {
    setSelectedStudentIds((prev) => (
      checked ? [...new Set([...prev, studentId])] : prev.filter((value) => value !== studentId)
    ));
  };

  const handlePrint = () => {
    if (reportsToRender.length === 0) {
      toast.error('No report cards are available for printing');
      return;
    }
    // Collect the HTML of only the report card elements
    const cards = document.querySelectorAll('[data-report-card="true"]');
    if (!cards.length) {
      window.print();
      return;
    }
    const printWindow = window.open('', '_blank');
    // Gather all stylesheet links from the current page
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');
    const cardsHtml = Array.from(cards).map((c) => c.outerHTML).join('\n');
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${cardsHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
    toast.success(`Opened print dialog for ${reportsToRender.length} report card${reportsToRender.length === 1 ? '' : 's'}`);
  };

  const handleExport = async () => {
    const reportCardElements = Array.from(
      reportCardsRef.current?.querySelectorAll('[data-report-card="true"]') || []
    );

    if (reportCardElements.length === 0) {
      toast.error('No report cards are available for export');
      return;
    }

    try {
      setExportingPdf(true);
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2);

      for (let index = 0; index < reportCardElements.length; index += 1) {
        const element = reportCardElements[index];
        const canvas = await html2canvas(element, {
          scale: 2, useCORS: true, backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth, windowHeight: element.scrollHeight,
        });

        const imageData = canvas.toDataURL('image/png');
        const imageHeight = (canvas.height * usableWidth) / canvas.width;

        if (index > 0) pdf.addPage();
        pdf.addImage(imageData, 'PNG', margin, margin, usableWidth, imageHeight, undefined, 'FAST');

        let remainingHeight = imageHeight - usableHeight;
        while (remainingHeight > 0) {
          pdf.addPage();
          const offsetY = margin - (imageHeight - remainingHeight);
          pdf.addImage(imageData, 'PNG', margin, offsetY, usableWidth, imageHeight, undefined, 'FAST');
          remainingHeight -= usableHeight;
        }
      }

      pdf.save(getReportCardFileName(selectedClass?.name, reportCardElements.length));
      toast.success(`Exported ${reportCardElements.length} report card${reportCardElements.length === 1 ? '' : 's'} to PDF`);
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(error.message || 'Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (isStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Academic Report</h2>
            <p className="text-gray-600 mt-1">Your report card and export come from the same final printable layout.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={!currentStudentReport}>
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExport} disabled={exportingPdf || !currentStudentReport}>
              <Download className="w-4 h-4 mr-2" />
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </Button>
          </div>
        </div>
        <div ref={reportCardsRef}>
          {currentStudentReport ? (
            <ReportCard report={currentStudentReport} classInfo={selectedClass} index={0} totalCards={1} />
          ) : (
            <Card className="border-dashed border-gray-300 bg-gray-50">
              <CardContent className="py-12 text-center text-gray-500">Your report is not available yet.</CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report Cards</h2>
          <p className="text-gray-600 mt-1">
            {isTeacher
              ? 'Generate report cards only for your assigned classes.'
              : 'Print one report card, a selected group, or the whole class at once.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExport} disabled={exportingPdf}>
            <Download className="w-4 h-4 mr-2" />
            {exportingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <Card className="border-gray-200 print:hidden">
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {availableClasses.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} - Grade {classItem.grade}{classItem.section ? ` (${classItem.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Students in class</p>
                <p className="text-2xl font-bold text-gray-900">{classReports.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Selected reports</p>
                <p className="text-2xl font-bold text-gray-900">{reportsToRender.length}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Homeroom teacher</p>
                <p className="text-base font-bold text-gray-900">{selectedClass?.homeroomTeacherName || 'Not Assigned'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Academic year</p>
                <p className="text-base font-bold text-gray-900">
                  {selectedClass ? `${selectedClass.academicYear || '-'} / ${selectedClass.semester || '-'}` : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Report Range</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={selectionMode === 'all' ? 'default' : 'outline'} className={selectionMode === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''} onClick={() => setSelectionMode('all')}>Whole Class</Button>
              <Button type="button" variant={selectionMode === 'selected' ? 'default' : 'outline'} className={selectionMode === 'selected' ? 'bg-blue-600 hover:bg-blue-700' : ''} onClick={() => setSelectionMode('selected')}>Selected Group</Button>
              <Button type="button" variant={selectionMode === 'single' ? 'default' : 'outline'} className={selectionMode === 'single' ? 'bg-blue-600 hover:bg-blue-700' : ''} onClick={() => setSelectionMode('single')}>Single Student</Button>
            </div>
          </div>

          {selectionMode === 'single' && (
            <div className="max-w-md space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {classReports.map((report) => (
                    <SelectItem key={report.student.id} value={report.student.id}>
                      {getStudentName(report.student)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectionMode === 'selected' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">Choose students</p>
                  <p className="text-sm text-gray-500">Only the checked students will be printed or exported.</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setSelectedStudentIds(classReports.map((report) => report.student.id))}>Select All</Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedStudentIds([])}>Clear</Button>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-gray-200 p-4 max-h-72 overflow-y-auto md:grid-cols-2">
                {classReports.length > 0 ? (
                  classReports.map((report) => (
                    <label key={report.student.id} className="flex items-start gap-3 rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50">
                      <Checkbox
                        checked={selectedStudentIds.includes(report.student.id)}
                        onCheckedChange={(value) => toggleStudentSelection(report.student.id, value === true)}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{getStudentName(report.student)}</p>
                        <p className="text-xs text-gray-500">Rank {report.rank} • Avg {report.average}% • {report.status}</p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No students are available for this class yet.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200 print:hidden">
        <CardHeader><CardTitle className="text-lg font-semibold">Class Snapshot</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Class Rank</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead className="text-center">Subjects</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classReports.length > 0 ? (
                  classReports.map((report) => (
                    <TableRow key={report.student.id}>
                      <TableCell className="font-medium">{getStudentName(report.student)}</TableCell>
                      <TableCell className="text-center">{report.rank}</TableCell>
                      <TableCell className="text-center">{report.average}%</TableCell>
                      <TableCell className="text-center">{report.marksWithSubjects.length}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${report.status === 'PASS' ? 'bg-green-600 text-white hover:bg-green-600 border-0' : 'bg-red-600 text-white hover:bg-red-600 border-0'}`}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No report data is available for this class yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div ref={reportCardsRef} className="space-y-6">
        {reportsToRender.length > 0 ? (
          reportsToRender.map((report, index) => (
            <ReportCard key={report.student.id} report={report} classInfo={selectedClass} index={index} totalCards={reportsToRender.length} />
          ))
        ) : (
          <Card className="border-dashed border-gray-300 bg-gray-50">
            <CardContent className="py-12 text-center text-gray-500">
              {selectionMode === 'selected'
                ? 'Select at least one student to preview report cards.'
                : 'No report cards are available for the current selection.'}
            </CardContent>
          </Card>
        )}
      </div>

      {visibleSubjects.length === 0 && (
        <Card className="border-amber-200 bg-amber-50 print:hidden">
          <CardContent className="py-4 text-sm text-amber-900">
            No marks have been entered for this class yet, so generated report cards will remain empty until marks are recorded.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
