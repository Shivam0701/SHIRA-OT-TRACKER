import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CompleteProfile() {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const [form, setForm]   = useState({ phone: '', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim()) { setError('Contact number is required.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/complete-profile', {
        phone:       form.phone.trim(),
        companyName: form.companyName.trim() || undefined,
      });
      setUser(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
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
          Hi {user?.name?.split(' ')[0] || 'there'}! Just need a couple more details to complete your profile.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Contact Number</label>
            <div className="auth-input-wrap">
              <Phone size={15} className="auth-input-icon" />
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

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
                value={form.companyName}
                onChange={e => set('companyName', e.target.value)}
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
        </form>
      </div>
    </div>
  );
}
