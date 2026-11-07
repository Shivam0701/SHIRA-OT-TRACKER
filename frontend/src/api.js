import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,   // send cookies on every request
});

export const getSessions    = (params = {}) => api.get('/sessions', { params });
export const getActiveSession = ()           => api.get('/sessions/active');
export const getStats       = ()             => api.get('/sessions/stats');
export const startSession   = (data)         => api.post('/sessions/start', data);
export const endSession     = (id, data)     => api.post(`/sessions/${id}/end`, data);
export const updateSession  = (id, data)     => api.put(`/sessions/${id}`, data);
export const deleteSession  = (id)           => api.delete(`/sessions/${id}`);

export const getExportUrl = (params = {}) => {
  const base = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';
  const qs = new URLSearchParams(params).toString();
  return `${base}/sessions/export${qs ? '?' + qs : ''}`;
};

export default api;
