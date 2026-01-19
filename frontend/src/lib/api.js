import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Student API
export const studentAPI = {
  getDashboard: () => api.get('/students/dashboard'),
  getCourses: () => api.get('/students/courses'),
  getApprovals: () => api.get('/students/approvals'),
  getTimetable: () => api.get('/students/timetable'),
  getGrades: () => api.get('/students/grades'),
};

// Teacher API
export const teacherAPI = {
  getDashboard: () => api.get('/teachers/dashboard'),
  getEnrollments: () => api.get('/teachers/enrollments'),
  getCourses: () => api.get('/teachers/courses'),
  getTimetable: () => api.get('/teachers/timetable'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getPendingStudents: () => api.get('/admin/students/pending'),
  approveStudent: (id) => api.post(`/admin/students/${id}/approve`),
  rejectStudent: (id) => api.post(`/admin/students/${id}/reject`),
  assignAdvisor: (id, advisorId) => api.post(`/admin/students/${id}/advisor`, { advisorId }),
  getAllStudents: () => api.get('/admin/students'),
  getAllTeachers: () => api.get('/admin/teachers'),
  getPendingTeachers: () => api.get('/admin/teachers/pending'),
  createTeacher: (data) => api.post('/admin/teachers', data),
  approveTeacher: (id) => api.post(`/admin/teachers/${id}/approve`),
  rejectTeacher: (id) => api.post(`/admin/teachers/${id}/reject`),
  removeTeacher: (id) => api.delete(`/admin/teachers/${id}`),
  getPendingCourses: () => api.get('/admin/courses/pending'),
  approveCourse: (id) => api.post(`/admin/courses/${id}/approve`),
  rejectCourse: (id) => api.post(`/admin/courses/${id}/reject`),
};

// Course API
export const courseAPI = {
  getApprovedCourses: (params) => api.get('/courses/approved', { params }),
  getCourseDetails: (id) => api.get(`/courses/${id}`),
  createOffering: (data) => api.post('/courses/offerings', data),
  getMyOfferings: () => api.get('/courses/offerings/my'),
  updateOffering: (id, data) => api.put(`/courses/offerings/${id}`, data),
};

// Enrollment API
export const enrollmentAPI = {
  enroll: (courseOfferingId) => api.post('/enrollments/enroll', { courseOfferingId }),
  drop: (id) => api.post(`/enrollments/drop/${id}`),
  getMyEnrollments: () => api.get('/enrollments/my'),
  approveInstructor: (id) => api.post(`/enrollments/approve/instructor/${id}`),
  approveAdvisor: (id) => api.post(`/enrollments/approve/advisor/${id}`),
  reject: (id) => api.post(`/enrollments/reject/${id}`),
};

// Grade API
export const gradeAPI = {
  assign: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
  publish: (id) => api.post(`/grades/${id}/publish`),
  getByCourse: (courseOfferingId) => api.get(`/grades/course/${courseOfferingId}`),
  getStudentGrades: () => api.get('/grades/student'),
};

// Timetable API
export const timetableAPI = {
  getTimetable: () => api.get('/timetable'),
  initialize: () => api.post('/timetable/initialize'),
};

export default api;
