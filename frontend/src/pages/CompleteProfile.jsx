import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CompleteProfile() {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  // api.js interceptor already sends Authorization: Bearer <ot_token> on every request.
  // No custom header needed here — just call api.post directly.
  const finish = async (body) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/complete-profile', body);
      sessionStorage.removeItem('ot_setup_token');
      setUser(res.data, res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{ fontSize: '28px' }}>⏱</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>SHIRA OT</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overtime Tracker</div>
          </div>
        </div>

        <h1 className="auth-title">One last step</h1>
        <p className="auth-sub">
          Hi {user?.name?.split(' ')[0] || 'there'}! Optionally add your company name.
        </p>

        <form onSubmit={e => { e.preventDefault(); finish({ companyName: companyName.trim() || undefined }); }} className="auth-form">
          <div className="auth-field">
            <label>
              Company Name{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="auth-input-wrap">
              <Building2 size={15} className="auth-input-icon" />
              <input
                type="text"
                placeholder="Your company"
                value={companyName}
                onChange={e => { setCompanyName(e.target.value); setError(''); }}
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <CheckCircle size={16} />
            {loading ? 'Saving…' : 'Complete Setup'}
          </button>

          <button
            type="button"
            className="btn btn-outline auth-submit"
            style={{ marginTop: '8px' }}
            onClick={() => finish({})}
            disabled={loading}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
