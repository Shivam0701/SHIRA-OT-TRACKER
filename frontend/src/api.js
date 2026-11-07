import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL:         BASE,
  withCredentials: false, // no cookies — we use Bearer token in localStorage
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getSessions      = (params = {}) => api.get('/sessions', { params });
export const getActiveSession = ()             => api.get('/sessions/active');
export const getStats         = ()             => api.get('/sessions/stats');
export const startSession     = (data)         => api.post('/sessions/start', data);
export const endSession       = (id, data)     => api.post(`/sessions/${id}/end`, data);
export const updateSession    = (id, data)     => api.put(`/sessions/${id}`, data);
export const deleteSession    = (id)           => api.delete(`/sessions/${id}`);

export const getExportUrl = (params = {}) => {
  const token = localStorage.getItem('ot_token');
  const qs    = new URLSearchParams(params).toString();
  const base  = `${BASE}/sessions/export${qs ? '?' + qs : ''}`;
  // Append token as query param for download links (can't set headers on <a href>)
  return token ? `${base}${qs ? '&' : '?'}_token=${token}` : base;
};

export default api;
