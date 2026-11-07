import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { setUser }    = useAuth();
  const called         = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    api.post('/auth/google/token', { token })
      .then(res => {
        setUser(res.data, res.data.token);
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=google_failed', { replace: true });
      });
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: 'var(--text-muted)', fontSize: '14px', gap: '10px',
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
        </path>
      </svg>
      Signing you in…
    </div>
  );
}
