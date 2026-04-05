import auth from './auth.js';

// API Service for connecting to backend
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, endpoint, url) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.url = url;
  }
}

class ApiService {
  getHeaders() {
    const token = auth.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${normalizedEndpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof data === 'string'
          ? `Request failed (${response.status})`
          : data?.error || data?.message || `Request failed (${response.status})`;

        if (response.status === 401) {
          auth.handleUnauthorized();
        }

        throw new ApiError(message, response.status, normalizedEndpoint, url);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError('Unable to reach the API server', 0, normalizedEndpoint, url);
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    return data;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Students
  async getStudents() {
    return this.request('/students');
  }

  async getStudent(id) {
    return this.request(`/students/${id}`);
  }

  async createStudent(student) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id, student) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async generateStudentCredentials(id, regenerate = false) {
    return this.request(`/students/${id}/generate-credentials`, {
      method: 'POST',
      body: JSON.stringify({ regenerate }),
    });
  }

  // Teachers
  async getTeachers() {
    return this.request('/teachers');
  }

  async getTeacher(id) {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(teacher) {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
  }

  async updateTeacher(id, teacher) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher),
    });
  }

  async deleteTeacher(id) {
    return this.request(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  async generateTeacherCredentials(id, regenerate = false) {
    return this.request(`/teachers/${id}/generate-credentials`, {
      method: 'POST',
      body: JSON.stringify({ regenerate }),
    });
  }

  // Subjects
  async getSubjects() {
    return this.request('/subjects');
  }

  async createSubject(subject) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  }

  async updateSubject(id, subject) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject),
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // Marks
  async getMarks(studentId) {
    const query = studentId ? `?studentId=${studentId}` : '';
    return this.request(`/marks${query}`);
  }

  async createMarks(marks) {
    return this.request('/marks', {
      method: 'POST',
      body: JSON.stringify(marks),
    });
  }

  async updateMark(id, marks) {
    return this.request(`/marks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ marks }),
    });
  }

  // Reports
  async getStudentReport(studentId, academicYearId) {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return this.request(`/reports/student/${studentId}${query}`);
  }

  async getClassReport(classId, academicYearId) {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    if (academicYearId) params.append('academicYearId', academicYearId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/reports/class${query}`);
  }

  // Classes
  async getClasses() {
    return this.request('/classes');
  }

  async getDepartments() {
    return this.request('/departments');
  }

  async getExamTypes() {
    return this.request('/exam-types');
  }

  async getAcademicYears() {
    return this.request('/academic-years');
  }

  async createClass(classData) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  async updateClass(id, classData) {
    return this.request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  }

  async deleteClass(id) {
    return this.request(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyCourseRegistrations() {
    return this.request('/course-registrations/me');
  }

  async saveMyCourseRegistrations(payload) {
    return this.request('/course-registrations/me', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyProfile() {
    return this.request('/profile/me');
  }

  async updateMyProfile(payload) {
    return this.request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async changeMyPassword(payload) {
    return this.request('/profile/me/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
export default api;
