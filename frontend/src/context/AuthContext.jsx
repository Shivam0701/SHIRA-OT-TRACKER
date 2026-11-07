import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'ot_token';

function saveToken(token)   { localStorage.setItem(TOKEN_KEY, token); }
function clearToken()       { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('ot_setup_token'); }
function getStoredToken()   { return localStorage.getItem(TOKEN_KEY); }

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist user AND token together
  const setUser = (userData, token) => {
    if (!userData) {
      clearToken();
      setUserState(null);
      return;
    }
    if (token) saveToken(token);
    setUserState(userData);
  };

  const checkAuth = useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUserState(res.data);
    } catch {
      clearToken();
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data, res.data.token);
    return res.data;
  };

  const register = async (name, email, password, phone, companyName) => {
    const res = await api.post('/auth/register', { name, email, password, phone, companyName });
    setUser(res.data, res.data.token);
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearToken();
    setUserState(null);
  };

  const needsProfile = false;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, needsProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
