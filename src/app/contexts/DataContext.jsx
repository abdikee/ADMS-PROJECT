import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';
import { API_URL } from '../services/config.js';

const DataContext = createContext(undefined);
const DATA_SYNC_KEY = 'sams_data_sync';
const DATA_SYNC_CHANNEL = 'sams_data_channel';
const REALTIME_REFRESH_INTERVAL_MS = 2000;
const hasRealCredentials = (username) => Boolean(username && !username.startsWith('temp_'));

const normalizeStudent = (student) => {
  const firstName = student.first_name || student.firstName;
  const lastName = student.last_name || student.lastName;

  return {
    ...student,
    id: String(student.id),
    firstName,
    lastName,
    name: student.name || [firstName, lastName].filter(Boolean).join(' '),
    rollNumber: student.roll_number || student.rollNumber,
    admissionNumber: student.admission_number || student.admissionNumber,
    dateOfBirth: student.date_of_birth || student.dateOfBirth,
    className: student.class_name || student.className,
    classId: student.class_id ?? student.classId,
    hasCredentials: student.hasCredentials ?? hasRealCredentials(student.username),
  };
};

const normalizeTeacher = (teacher) => {
  const firstName = teacher.first_name || teacher.firstName;
  const lastName = teacher.last_name || teacher.lastName;
  const assignedClassIds = typeof teacher.assigned_class_ids === 'string'
    ? teacher.assigned_class_ids.split(',').map((value) => value.trim()).filter(Boolean)
    : Array.isArray(teacher.assignedClassIds)
      ? teacher.assignedClassIds.map((value) => String(value))
      : teacher.assignedClassId
        ? [String(teacher.assignedClassId)]
        : teacher.assigned_class_id
          ? [String(teacher.assigned_class_id)]
          : [];
  const assignedClassNames = typeof teacher.assigned_class_names === 'string'
    ? teacher.assigned_class_names.split('||').map((value) => value.trim()).filter(Boolean)
    : Array.isArray(teacher.assignedClassNames)
      ? teacher.assignedClassNames.filter(Boolean)
      : teacher.assignedClassName
        ? [teacher.assignedClassName]
        : teacher.assigned_class_name
          ? [teacher.assigned_class_name]
          : [];

  return {
    ...teacher,
    id: String(teacher.id),
    firstName,
    lastName,
    email: teacher.email,
    phone: teacher.phone,
    departmentId: teacher.department_id ?? teacher.departmentId,
    departmentName: teacher.department_name || teacher.departmentName,
    qualification: teacher.qualification,
    hireDate: teacher.hire_date || teacher.hireDate,
    username: teacher.username,
    subjectId: teacher.subject_id !== undefined && teacher.subject_id !== null ? String(teacher.subject_id) : undefined,
    subjectName: teacher.subject_name || teacher.subjectName,
    assignedClassId: assignedClassIds[0] || (teacher.assigned_class_id !== undefined && teacher.assigned_class_id !== null ? String(teacher.assigned_class_id) : undefined),
    assignedClassName: assignedClassNames[0] || teacher.assigned_class_name || teacher.assignedClassName,
    assignedClassIds,
    assignedClassNames,
    homeroomClassId: teacher.homeroom_class_id !== undefined && teacher.homeroom_class_id !== null ? String(teacher.homeroom_class_id) : undefined,
    homeroomClassName: teacher.homeroom_class_name || teacher.homeroomClassName,
    hasCredentials: teacher.hasCredentials ?? hasRealCredentials(teacher.username),
  };
};

const normalizeSubject = (subject) => ({
  ...subject,
  id: String(subject.id),
  name: subject.name,
  code: subject.code,
  description: subject.description,
  maxMarks: Number(subject.max_marks ?? subject.maxMarks ?? 100),
  passingMarks: Number(subject.passing_marks ?? subject.passingMarks ?? 50),
  departmentId: subject.department_id ?? subject.departmentId,
  departmentName: subject.department_name || subject.departmentName,
  creditHours: Number(subject.credit_hours ?? subject.creditHours ?? 3),
});

const normalizeDepartment = (department) => ({
  id: String(department.id),
  name: department.name,
  code: department.code,
  description: department.description,
});

const normalizeMark = (mark) => ({
  ...mark,
  id: String(mark.id),
  studentId: String(mark.student_id ?? mark.studentId),
  subjectId: String(mark.subject_id ?? mark.subjectId),
  classId: mark.class_id !== undefined ? String(mark.class_id) : (mark.classId !== undefined ? String(mark.classId) : undefined),
  examTypeId: mark.exam_type_id !== undefined ? String(mark.exam_type_id) : (mark.examTypeId !== undefined ? String(mark.examTypeId) : undefined),
  academicYearId: mark.academic_year_id !== undefined ? String(mark.academic_year_id) : (mark.academicYearId !== undefined ? String(mark.academicYearId) : undefined),
  marks: Number(mark.marks_obtained ?? mark.marks ?? 0),
  maxMarks: Number(mark.max_marks ?? mark.maxMarks ?? 100),
  grade: mark.grade,
  remarks: mark.remarks,
  teacherId: mark.teacher_id !== undefined ? String(mark.teacher_id) : (mark.teacherId !== undefined ? String(mark.teacherId) : undefined),
  examDate: mark.exam_date || mark.examDate,
});

const normalizeExamType = (examType) => ({
  id: String(examType.id),
  name: examType.name,
  code: examType.code,
});

const normalizeAcademicYear = (academicYear) => ({
  id: String(academicYear.id),
  year: academicYear.year,
  semester: academicYear.semester,
  startDate: academicYear.start_date || academicYear.startDate,
  endDate: academicYear.end_date || academicYear.endDate,
  isActive: Boolean(academicYear.is_active ?? academicYear.isActive),
});

const normalizeClass = (classItem) => ({
  id: String(classItem.id),
  name: classItem.name,
  grade: String(classItem.grade),
  section: classItem.section,
  academicYearId: classItem.academic_year_id !== undefined && classItem.academic_year_id !== null ? String(classItem.academic_year_id) : undefined,
  academicYear: classItem.academic_year || classItem.academicYear,
  semester: classItem.semester,
  homeroomTeacherId: classItem.homeroom_teacher_id !== undefined && classItem.homeroom_teacher_id !== null ? String(classItem.homeroom_teacher_id) : undefined,
  homeroomTeacherName: classItem.homeroomTeacherName || [classItem.teacher_first_name, classItem.teacher_last_name].filter(Boolean).join(' '),
  maxStudents: Number(classItem.max_students ?? classItem.maxStudents ?? 40),
  studentCount: Number(classItem.student_count ?? classItem.studentCount ?? 0),
});

const getCollectionFromResult = (result, keys, label, failures) => {
  if (result.status === 'fulfilled') {
    const value = result.value;

    if (Array.isArray(value)) {
      return value;
    }

    for (const key of keys) {
      if (Array.isArray(value?.[key])) {
        return value[key];
      }
    }

    return [];
  }

  const status = typeof result.reason?.status === 'number' && result.reason.status > 0
    ? ` (${result.reason.status})`
    : '';
  const message = result.reason?.message ? `: ${result.reason.message}` : '';

  failures.push(`${label}${status}${message}`);
  return [];
};

export function DataProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [marks, setMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchInFlightRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  const eventSourceRef = useRef(null);

  const fetchAllData = useCallback(async ({ silent = false, force = false } = {}) => {
    if (fetchInFlightRef.current && !force) {
      return fetchInFlightRef.current;
    }

    const runFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setStudents([]);
        setSubjects([]);
        setDepartments([]);
        setTeachers([]);
        setMarks([]);
        setClasses([]);
        setExamTypes([]);
        setAcademicYears([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const results = await Promise.allSettled([
          api.getStudents(),
          api.getTeachers(),
          api.getSubjects(),
          api.getDepartments(),
          api.getMarks(),
          api.getClasses(),
          api.getExamTypes(),
          api.getAcademicYears(),
        ]);

        const [
          studentsResult,
          teachersResult,
          subjectsResult,
          departmentsResult,
          marksResult,
          classesResult,
          examTypesResult,
          academicYearsResult,
        ] = results;

        const failures = [];
        const studentsRaw = getCollectionFromResult(studentsResult, ['students', 'data'], 'students', failures);
        const teachersRaw = getCollectionFromResult(teachersResult, ['teachers', 'data'], 'teachers', failures);
        const subjectsRaw = getCollectionFromResult(subjectsResult, ['subjects', 'data'], 'subjects', failures);
        const departmentsRaw = getCollectionFromResult(departmentsResult, ['departments', 'data'], 'departments', failures);
        const marksRaw = getCollectionFromResult(marksResult, ['marks', 'data'], 'marks', failures);
        const classesRaw = getCollectionFromResult(classesResult, ['classes', 'data'], 'classes', failures);
        const examTypesRaw = getCollectionFromResult(examTypesResult, ['examTypes', 'data'], 'exam types', failures);
        const academicYearsRaw = getCollectionFromResult(academicYearsResult, ['academicYears', 'data'], 'academic years', failures);

        setStudents(studentsRaw.map(normalizeStudent));
        setTeachers(teachersRaw.map(normalizeTeacher));
        setSubjects(subjectsRaw.map(normalizeSubject));
        setDepartments(departmentsRaw.map(normalizeDepartment));
        setMarks(marksRaw.map(normalizeMark));
        setClasses(classesRaw.map(normalizeClass));
        setExamTypes(examTypesRaw.map(normalizeExamType));
        setAcademicYears(academicYearsRaw.map(normalizeAcademicYear));

        if (failures.length === 0) {
          setError(null);
        } else if (failures.length === results.length) {
          setError('Unable to load data from the API. Check that the backend is running and up to date.');
        } else {
          setError(`Some data could not be loaded: ${failures.join(', ')}`);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

    const promise = runFetch().finally(() => {
      fetchInFlightRef.current = null;
    });

    fetchInFlightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = useCallback(async () => {
    await fetchAllData({ force: true });
  }, [fetchAllData]);

  const refreshDataSilently = useCallback(async () => {
    await fetchAllData({ silent: true });
  }, [fetchAllData]);

  const notifyDataChanged = useCallback(() => {
    const payload = JSON.stringify({ ts: Date.now() });
    localStorage.setItem(DATA_SYNC_KEY, payload);
    broadcastChannelRef.current?.postMessage(payload);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if ('BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel(DATA_SYNC_CHANNEL);
    }

    const handleStorage = (event) => {
      if (event.key === DATA_SYNC_KEY && event.newValue) {
        void refreshDataSilently();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshDataSilently();
      }
    };

    const handleWindowFocus = () => {
      void refreshDataSilently();
    };

    const handleOnline = () => {
      void refreshDataSilently();
    };

    const handleBroadcastMessage = () => {
      void refreshDataSilently();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    broadcastChannelRef.current?.addEventListener('message', handleBroadcastMessage);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshDataSilently();
      }
    }, REALTIME_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
      broadcastChannelRef.current?.removeEventListener('message', handleBroadcastMessage);
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, [refreshDataSilently]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return undefined;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return undefined;
    }

    const eventSource = new EventSource(`${API_URL}/realtime/stream?token=${encodeURIComponent(token)}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = () => {
      void refreshDataSilently();
    };

    eventSource.onerror = () => {
      void refreshDataSilently();
    };

    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
    };
  }, [refreshDataSilently]);

  const addStudent = useCallback(async (student) => {
    await api.createStudent(student);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const updateStudent = useCallback(async (id, student) => {
    await api.updateStudent(id, student);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const deleteStudent = useCallback(async (id) => {
    await api.deleteStudent(id);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const addSubject = useCallback(async (subject) => {
    await api.createSubject(subject);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const updateSubject = useCallback(async (id, subject) => {
    await api.updateSubject(id, subject);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const deleteSubject = useCallback(async (id) => {
    await api.deleteSubject(id);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const addTeacher = useCallback(async (teacher) => {
    await api.createTeacher(teacher);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const updateTeacher = useCallback(async (id, teacher) => {
    await api.updateTeacher(id, teacher);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const deleteTeacher = useCallback(async (id) => {
    await api.deleteTeacher(id);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const addClass = useCallback(async (classData) => {
    await api.createClass(classData);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const updateClass = useCallback(async (id, classData) => {
    await api.updateClass(id, classData);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const deleteClass = useCallback(async (id) => {
    await api.deleteClass(id);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const addMarks = useCallback(async (newMarks) => {
    await api.createMarks(newMarks);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const updateMark = useCallback(async (id, marksValue) => {
    await api.updateMark(id, marksValue);
    await refreshData();
    notifyDataChanged();
  }, [notifyDataChanged, refreshData]);

  const getStudentMarks = useCallback((studentId) => {
    return marks.filter((mark) => mark.studentId === studentId);
  }, [marks]);

  const getStudentReport = useCallback((studentId) => {
    const student = students.find((item) => item.id === studentId);
    if (!student) return null;

    const studentMarks = marks.filter((mark) => mark.studentId === studentId);
    const marksWithSubjects = studentMarks.map((mark) => {
      const subject = subjects.find((item) => item.id === mark.subjectId);
      return {
        subjectId: mark.subjectId,
        subject: subject?.name || 'Unknown',
        marks: mark.marks,
        maxMarks: subject?.maxMarks || mark.maxMarks || 100,
      };
    });

    const total = studentMarks.reduce((sum, mark) => sum + mark.marks, 0);
    const maxTotal = marksWithSubjects.reduce((sum, mark) => sum + mark.maxMarks, 0);
    const average = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const status = average >= 50 ? 'PASS' : 'FAIL';

    const classmates = students.filter((item) => String(item.classId) === String(student.classId));
    const rankedClassmates = classmates.map((item) => {
      const currentMarks = marks.filter((mark) => mark.studentId === item.id);
      const obtained = currentMarks.reduce((sum, mark) => sum + mark.marks, 0);
      const maximum = currentMarks.reduce((sum, mark) => sum + (mark.maxMarks || 100), 0);
      const currentAverage = maximum > 0 ? (obtained / maximum) * 100 : 0;
      return { studentId: item.id, total: obtained, average: currentAverage };
    }).sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;
      return right.average - left.average;
    });

    let rank = 0;
    let previousTotal = null;
    for (let index = 0; index < rankedClassmates.length; index += 1) {
      const item = rankedClassmates[index];
      if (previousTotal !== item.total) {
        rank = index + 1;
        previousTotal = item.total;
      }
      if (item.studentId === studentId) {
        break;
      }
    }

    return {
      student,
      marksWithSubjects,
      total,
      maxTotal,
      average: average.toFixed(2),
      status,
      rank,
    };
  }, [students, subjects, marks]);

  const generateCredentials = useCallback(async (type, id) => {
    const response = type === 'student'
      ? await api.generateStudentCredentials(id, false)
      : await api.generateTeacherCredentials(id, false);

    await refreshData();
    notifyDataChanged();

    return {
      username: response.username,
      password: response.password,
    };
  }, [notifyDataChanged, refreshData]);

  const regenerateCredentials = useCallback(async (type, id) => {
    const response = type === 'student'
      ? await api.generateStudentCredentials(id, true)
      : await api.generateTeacherCredentials(id, true);

    await refreshData();
    notifyDataChanged();

    return {
      username: response.username,
      password: response.password,
    };
  }, [notifyDataChanged, refreshData]);

  return (
    <DataContext.Provider
      value={{
        students,
        subjects,
        departments,
        teachers,
        marks,
        classes,
        examTypes,
        academicYears,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        addSubject,
        updateSubject,
        deleteSubject,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addClass,
        updateClass,
        deleteClass,
        addMarks,
        updateMark,
        getStudentMarks,
        getStudentReport,
        generateCredentials,
        regenerateCredentials,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
