import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// User endpoints
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/update', data),
  getAllUsers: (params) => api.get('/users/all', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Project endpoints
export const projectAPI = {
  create: (data) => api.post('/projects', data),
  getAll: () => api.get('/projects'),
  getMy: () => api.get('/projects/my'),
  join: (id, data) => api.post(`/projects/join/${id}`, data),
  leave: (id) => api.post(`/projects/leave/${id}`),
  approve: (projectId, userId) => api.post(`/projects/approve/${projectId}/${userId}`),
  reject: (projectId, userId) => api.post(`/projects/reject/${projectId}/${userId}`),
};

// Match endpoints
export const matchAPI = {
  getUsers: () => api.get('/match/users'),
  getProjects: () => api.get('/match/projects'),
};

// GitHub endpoints
export const githubAPI = {
  login: (userId) => {
    window.open(`${import.meta.env.VITE_API_URL}/api/github/login?userId=${userId}`, '_blank', 'width=600,height=700');
  },
  linkRepo: (data) => api.post('/github/link-repo', data),
  getFiles: (projectId, path = '') => api.get(`/github/files/${projectId}?path=${path}`),
  getFileContent: (projectId, path) => api.get(`/github/file-content/${projectId}?path=${path}`),
  updateFile: (data) => api.put('/github/update-file', data),
};

export default api;