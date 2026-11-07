import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const BACKEND = import.meta.env.VITE_API_URL || '';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', phone: '', companyName: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) { setError('Name, email, phone and password are required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone, form.companyName);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${BACKEND}/api/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.svg" alt="SHIRA OT" width={44} height={44} style={{ borderRadius: 10 }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>SHIRA OT</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overtime Tracker</div>
          </div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start tracking your overtime today</p>

        {/* Google Sign-Up */}
        <button
          type="button"
          className="btn-google"
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Full Name</label>
            <div className="auth-input-wrap">
              <User size={15} className="auth-input-icon" />
              <input type="text" placeholder="Your name" value={form.name}
                onChange={e => set('name', e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" disabled={loading} />
            </div>
          </div>

          <div className="auth-field">
            <label>Contact Number</label>
            <div className="auth-input-wrap">
              <Phone size={15} className="auth-input-icon" />
              <input type="tel" placeholder="+91 9876543210" value={form.phone}
                onChange={e => set('phone', e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="auth-field">
            <label>Company Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <div className="auth-input-wrap">
              <Building2 size={15} className="auth-input-icon" />
              <input type="text" placeholder="Your company" value={form.companyName}
                onChange={e => set('companyName', e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type="password" placeholder="Repeat password" value={form.confirm}
                onChange={e => set('confirm', e.target.value)} disabled={loading} />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
