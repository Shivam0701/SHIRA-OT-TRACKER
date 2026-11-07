import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const { setUser } = useAuth();
  const navigate    = useNavigate();
  const [step, setStep]           = useState(1); // 1 = enter otp, 2 = new password
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showCf, setShowCf]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) { setError('Email and code are required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(res.data.resetToken);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password)            { setError('Password is required.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/reset-password', { resetToken, password });
      setUser(res.data, res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  const logoBlock = (
    <div className="auth-logo">
      <img src="/logo.svg" alt="SHIRA OT" width={44} height={44} style={{ borderRadius: 10 }} />
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>SHIRA OT</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overtime Tracker</div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div className="auth-page">
      <div className="auth-card">
        {logoBlock}
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">Enter the code sent to your email.</p>
        <form onSubmit={handleVerify} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
            </div>
          </div>
          <div className="auth-field">
            <label>Reset Code</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="text" inputMode="numeric" placeholder="000000" maxLength={6}
                value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                disabled={loading}
                style={{ letterSpacing: '6px', fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>
        <p className="auth-switch">
          <Link to="/forgot-password">← Request a new code</Link>
        </p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        {logoBlock}
        <h1 className="auth-title">New password</h1>
        <p className="auth-sub">Choose a strong password for your account.</p>

        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={14} /> Identity verified. Set your new password.
        </div>

        <form onSubmit={handleReset} className="auth-form">
          <div className="auth-field">
            <label>New Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 10px', display: 'flex', alignItems: 'center' }}
                aria-label={showPw ? 'Hide' : 'Show'}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type={showCf ? 'text' : 'password'} placeholder="Repeat password"
                value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
                disabled={loading} />
              <button type="button" onClick={() => setShowCf(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 10px', display: 'flex', alignItems: 'center' }}
                aria-label={showCf ? 'Hide' : 'Show'}>
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <Lock size={16} />{loading ? 'Saving…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
