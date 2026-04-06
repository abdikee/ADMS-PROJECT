import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.js';
import { API_URL } from '../services/config.js';

const DataContext = createContext(undefined);
const DATA_SYNC_KEY = 'sams_data_sync';
const DATA_SYNC_CHANNEL = 'sams_data_channel';
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
  weightage: Number(examType.weightage ?? 100),
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
    if (Array.isArray(value)) return value;
    for (const key of keys) {
      if (Array.isArray(value?.[key])) return value[key];
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

// Map SSE entity names to fetch functions and setters
const ENTITY_FETCHERS = {
  students: { fetch: () => api.getStudents(), keys: ['students', 'data'], normalize: normalizeStudent },
  teachers: { fetch: () => api.getTeachers(), keys: ['teachers', 'data'], normalize: normalizeTeacher },
  subjects: { fetch: () => api.getSubjects(), keys: ['subjects', 'data'], normalize: normalizeSubject },
  departments: { fetch: () => api.getDepartments(), keys: ['departments', 'data'], normalize: normalizeDepartment },
  marks: { fetch: () => api.getMarks(), keys: ['marks', 'data'], normalize: normalizeMark },
  classes: { fetch: () => api.getClasses(), keys: ['classes', 'data'], normalize: normalizeClass },
  examTypes: { fetch: () => api.getExamTypes(), keys: ['examTypes', 'data'], normalize: normalizeExamType },
  academicYears: { fetch: () => api.getAcademicYears(), keys: ['academicYears', 'data'], normalize: normalizeAcademicYear },
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

  const setters = useRef({
    students: setStudents,
    teachers: setTeachers,
    subjects: setSubjects,
    departments: setDepartments,
    marks: setMarks,
    classes: setClasses,
    examTypes: setExamTypes,
    academicYears: setAcademicYears,
  });

  // Refresh only the affected entity collection
  const refreshEntity = useCallback(async (entity) => {
    const config = ENTITY_FETCHERS[entity];
    const setter = setters.current[entity];
    if (!config || !setter) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const result = await config.fetch();
      const raw = Array.isArray(result)
        ? result
        : config.keys.reduce((acc, key) => acc || result?.[key], null) || [];
      setter(raw.map(config.normalize));
    } catch (err) {
      console.error(`Failed to refresh ${entity}:`, err);
    }
  }, []);

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

      if (!silent) setLoading(true);
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
          studentsResult, teachersResult, subjectsResult, departmentsResult,
          marksResult, classesResult, examTypesResult, academicYearsResult,
        ] = results;

        const failures = [];
        setStudents(getCollectionFromResult(studentsResult, ['students', 'data'], 'students', failures).map(normalizeStudent));
        setTeachers(getCollectionFromResult(teachersResult, ['teachers', 'data'], 'teachers', failures).map(normalizeTeacher));
        setSubjects(getCollectionFromResult(subjectsResult, ['subjects', 'data'], 'subjects', failures).map(normalizeSubject));
        setDepartments(getCollectionFromResult(departmentsResult, ['departments', 'data'], 'departments', failures).map(normalizeDepartment));
        setMarks(getCollectionFromResult(marksResult, ['marks', 'data'], 'marks', failures).map(normalizeMark));
        setClasses(getCollectionFromResult(classesResult, ['classes', 'data'], 'classes', failures).map(normalizeClass));
        setExamTypes(getCollectionFromResult(examTypesResult, ['examTypes', 'data'], 'exam types', failures).map(normalizeExamType));
        setAcademicYears(getCollectionFromResult(academicYearsResult, ['academicYears', 'data'], 'academic years', failures).map(normalizeAcademicYear));

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
        if (!silent) setLoading(false);
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

  const notifyDataChanged = useCallback((entity) => {
    const payload = JSON.stringify({ ts: Date.now(), entity: entity || null });
    localStorage.setItem(DATA_SYNC_KEY, payload);
    broadcastChannelRef.current?.postMessage(payload);
  }, []);

  // Cross-tab sync + visibility/focus/online handlers
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if ('BroadcastChannel' in window) {
      broadcastChannelRef.current = new BroadcastChannel(DATA_SYNC_CHANNEL);
    }

    const handleStorage = (event) => {
      if (event.key === DATA_SYNC_KEY && event.newValue) {
        try {
          const { entity } = JSON.parse(event.newValue);
          if (entity && ENTITY_FETCHERS[entity]) {
            void refreshEntity(entity);
          } else {
            void refreshDataSilently();
          }
        } catch {
          void refreshDataSilently();
        }
      }
    };

    const handleBroadcastMessage = (event) => {
      try {
        const { entity } = JSON.parse(event.data);
        if (entity && ENTITY_FETCHERS[entity]) {
          void refreshEntity(entity);
        } else {
          void refreshDataSilently();
        }
      } catch {
        void refreshDataSilently();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshDataSilently();
    };

    const handleWindowFocus = () => void refreshDataSilently();
    const handleOnline = () => void refreshDataSilently();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    broadcastChannelRef.current?.addEventListener('message', handleBroadcastMessage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      broadcastChannelRef.current?.removeEventListener('message', handleBroadcastMessage);
      broadcastChannelRef.current?.close();
      broadcastChannelRef.current = null;
    };
  }, [refreshDataSilently, refreshEntity]);

  // SSE: selective refresh based on entity in the event payload
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return undefined;

    const token = localStorage.getItem('token');
    if (!token) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return undefined;
    }

    const eventSource = new EventSource(`${API_URL}/realtime/stream?token=${encodeURIComponent(token)}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'data-changed' && data.entity && ENTITY_FETCHERS[data.entity]) {
          void refreshEntity(data.entity);
        } else if (data.type === 'data-changed') {
          void refreshDataSilently();
        }
        // 'connected' events are ignored
      } catch {
        void refreshDataSilently();
      }
    };

    eventSource.onerror = () => {
      // SSE will auto-reconnect; do a silent full refresh to catch any missed updates
      void refreshDataSilently();
    };

    return () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) eventSourceRef.current = null;
    };
  }, [refreshDataSilently, refreshEntity]);

  const addStudent = useCallback(async (student) => {
    await api.createStudent(student);
    await refreshEntity('students');
    notifyDataChanged('students');
  }, [notifyDataChanged, refreshEntity]);

  const updateStudent = useCallback(async (id, student) => {
    await api.updateStudent(id, student);
    await refreshEntity('students');
    notifyDataChanged('students');
  }, [notifyDataChanged, refreshEntity]);

  const deleteStudent = useCallback(async (id) => {
    await api.deleteStudent(id);
    await refreshEntity('students');
    notifyDataChanged('students');
  }, [notifyDataChanged, refreshEntity]);

  const addSubject = useCallback(async (subject) => {
    await api.createSubject(subject);
    await refreshEntity('subjects');
    notifyDataChanged('subjects');
  }, [notifyDataChanged, refreshEntity]);

  const updateSubject = useCallback(async (id, subject) => {
    await api.updateSubject(id, subject);
    await refreshEntity('subjects');
    notifyDataChanged('subjects');
  }, [notifyDataChanged, refreshEntity]);

  const deleteSubject = useCallback(async (id) => {
    await api.deleteSubject(id);
    await refreshEntity('subjects');
    notifyDataChanged('subjects');
  }, [notifyDataChanged, refreshEntity]);

  const addTeacher = useCallback(async (teacher) => {
    await api.createTeacher(teacher);
    await refreshEntity('teachers');
    notifyDataChanged('teachers');
  }, [notifyDataChanged, refreshEntity]);

  const updateTeacher = useCallback(async (id, teacher) => {
    await api.updateTeacher(id, teacher);
    await refreshEntity('teachers');
    notifyDataChanged('teachers');
  }, [notifyDataChanged, refreshEntity]);

  const deleteTeacher = useCallback(async (id) => {
    await api.deleteTeacher(id);
    await refreshEntity('teachers');
    notifyDataChanged('teachers');
  }, [notifyDataChanged, refreshEntity]);

  const addClass = useCallback(async (classData) => {
    await api.createClass(classData);
    await refreshEntity('classes');
    notifyDataChanged('classes');
  }, [notifyDataChanged, refreshEntity]);

  const updateClass = useCallback(async (id, classData) => {
    await api.updateClass(id, classData);
    await refreshEntity('classes');
    notifyDataChanged('classes');
  }, [notifyDataChanged, refreshEntity]);

  const deleteClass = useCallback(async (id) => {
    await api.deleteClass(id);
    await refreshEntity('classes');
    notifyDataChanged('classes');
  }, [notifyDataChanged, refreshEntity]);

  const addMarks = useCallback(async (newMarks) => {
    await api.createMarks(newMarks);
    await refreshEntity('marks');
    notifyDataChanged('marks');
  }, [notifyDataChanged, refreshEntity]);

  const updateMark = useCallback(async (id, marksValue) => {
    await api.updateMark(id, marksValue);
    await refreshEntity('marks');
    notifyDataChanged('marks');
  }, [notifyDataChanged, refreshEntity]);

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
      if (item.studentId === studentId) break;
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

    const entity = type === 'student' ? 'students' : 'teachers';
    await refreshEntity(entity);
    notifyDataChanged(entity);

    return { username: response.username, password: response.password };
  }, [notifyDataChanged, refreshEntity]);

  const regenerateCredentials = useCallback(async (type, id) => {
    const response = type === 'student'
      ? await api.generateStudentCredentials(id, true)
      : await api.generateTeacherCredentials(id, true);

    const entity = type === 'student' ? 'students' : 'teachers';
    await refreshEntity(entity);
    notifyDataChanged(entity);

    return { username: response.username, password: response.password };
  }, [notifyDataChanged, refreshEntity]);

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
