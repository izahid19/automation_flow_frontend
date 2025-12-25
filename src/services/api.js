import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
};

// Quote APIs
export const quoteAPI = {
  create: (data) => api.post('/quotes', data),
  getAll: (params) => api.get('/quotes', { params }),
  getOne: (id) => api.get(`/quotes/${id}`),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  submit: (id) => api.post(`/quotes/${id}/submit`),
  approveSE: (id, data) => api.post(`/quotes/${id}/approve-se`, data),
  rejectSE: (id, data) => api.post(`/quotes/${id}/reject-se`, data),
  approveMD: (id, data) => api.post(`/quotes/${id}/approve-md`, data),
  rejectMD: (id, data) => api.post(`/quotes/${id}/reject-md`, data),
  updateDesign: (id, data) => api.post(`/quotes/${id}/design-status`, data),
  getStats: () => api.get('/quotes/stats'),
  downloadPDF: (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' }),
};

// Purchase Order APIs
export const orderAPI = {
  create: (data) => api.post('/purchase-orders', data),
  getAll: (params) => api.get('/purchase-orders', { params }),
  getOne: (id) => api.get(`/purchase-orders/${id}`),
  send: (id) => api.post(`/purchase-orders/${id}/send`),
  updateStatus: (id, data) => api.put(`/purchase-orders/${id}/status`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
};

// Manufacturer APIs
export const manufacturerAPI = {
  create: (data) => api.post('/manufacturers', data),
  getAll: (params) => api.get('/manufacturers', { params }),
  getOne: (id) => api.get(`/manufacturers/${id}`),
  update: (id, data) => api.put(`/manufacturers/${id}`, data),
  delete: (id) => api.delete(`/manufacturers/${id}`),
};

export default api;
