import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (u?.role === 'super_admin') window.location.href = '/superadmin-login';
      else if (u?.role === 'hr') window.location.href = '/admin-login';
      else window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
