import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Building2, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const BACKEND = import.meta.env.VITE_API_URL || '';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ── Step indicator ─────────────────────────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Details', 'Verify Email', 'Set Password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((label, i) => {
        const idx     = i + 1;
        const done    = idx < current;
        const active  = idx === current;
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--bg-input)',
                color: done || active ? '#fff' : 'var(--text-muted)',
                border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>
                {done ? <CheckCircle size={14} /> : idx}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 2, background: idx < current ? 'var(--success)' : 'var(--border)', margin: '0 4px', marginBottom: 18, transition: 'background 0.2s', flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Register() {
  const { setUser }  = useAuth();
  const navigate     = useNavigate();
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ name: '', email: '', companyName: '' });
  const [otp, setOtp]           = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCf, setShowCf]     = useState(false);
  const [setupToken, setSetupToken] = useState('');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef             = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = (secs = 60) => {
    setCooldown(secs);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!form.name.trim())  { setError('Full name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/send-otp', form);
      setInfo(`Verification code sent to ${form.email}`);
      setStep(2);
      startCooldown(60);
    } catch (err) {
      const wait = err.response?.data?.waitSeconds;
      if (wait) { startCooldown(wait); setError(`Please wait ${wait}s before requesting a new code.`); }
      else setError(err.response?.data?.error || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp.trim()) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email: form.email, otp });
      setSetupToken(res.data.setupToken);
      setStep(3);
      setInfo('');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally { setLoading(false); }
  };

  // ── Step 3: set password ──────────────────────────────────────────────────
  const handleSetPassword = async (e) => {
    e?.preventDefault();
    if (!password)              { setError('Password is required.'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/set-password', { setupToken, password });
      setUser(res.data, res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set password.');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => { window.location.href = `${BACKEND}/api/auth/google`; };

  const logoBlock = (
    <div className="auth-logo">
      <img src="/logo.svg" alt="SHIRA OT" width={44} height={44} style={{ borderRadius: 10 }} />
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>SHIRA OT</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overtime Tracker</div>
      </div>
    </div>
  );

  // ── Render step 1 ─────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="auth-page">
      <div className="auth-card">
        {logoBlock}
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start tracking your overtime today</p>

        <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
          <GoogleIcon /> Continue with Google
        </button>
        <div className="auth-divider"><span>or register with email</span></div>

        <form onSubmit={handleSendOtp} className="auth-form">
          <Steps current={1} />
          <div className="auth-field">
            <label>Full Name</label>
            <div className="auth-input-wrap">
              <User size={15} className="auth-input-icon" />
              <input type="text" placeholder="Your name" value={form.name}
                onChange={e => set('name', e.target.value)} disabled={loading} autoFocus />
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
            <label>Company Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <div className="auth-input-wrap">
              <Building2 size={15} className="auth-input-icon" />
              <input type="text" placeholder="Your company" value={form.companyName}
                onChange={e => set('companyName', e.target.value)} disabled={loading} />
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <Mail size={16} />{loading ? 'Sending code…' : 'Send Verification Code'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );

  // ── Render step 2 ─────────────────────────────────────────────────────────
  if (step === 2) return (
    <div className="auth-page">
      <div className="auth-card">
        {logoBlock}
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-sub">We sent a 6-digit code to <strong>{form.email}</strong></p>

        <form onSubmit={handleVerifyOtp} className="auth-form">
          <Steps current={2} />
          <div className="auth-field">
            <label>Verification Code</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                disabled={loading}
                autoFocus
                style={{ letterSpacing: '6px', fontSize: 18, fontWeight: 700, textAlign: 'center' }}
              />
            </div>
          </div>
          {info  && <div className="alert alert-success"><CheckCircle size={14} />{info}</div>}
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {cooldown > 0 ? (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Resend available in <strong>{cooldown}s</strong>
            </span>
          ) : (
            <button onClick={handleSendOtp} disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
              Resend code
            </button>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <button onClick={() => { setStep(1); setError(''); setInfo(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>
            ← Change email
          </button>
        </p>
      </div>
    </div>
  );

  // ── Render step 3 ─────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        {logoBlock}
        <h1 className="auth-title">Set your password</h1>
        <p className="auth-sub">Choose a secure password for your account</p>

        <form onSubmit={handleSetPassword} className="auth-form">
          <Steps current={3} />
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 10px', display: 'flex', alignItems: 'center' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}>
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
                aria-label={showCf ? 'Hide password' : 'Show password'}>
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            <UserPlus size={16} />{loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
