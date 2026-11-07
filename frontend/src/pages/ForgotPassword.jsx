import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api.js';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = (secs = 60) => {
    setCooldown(secs);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      startCooldown(60);
    } catch {
      setError('Failed to send code. Please try again.');
    } finally { setLoading(false); }
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

        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-sub">Enter your email and we'll send a reset code.</p>

        {sent && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle size={14} />
            If an account exists for <strong>{email}</strong>, a reset code has been sent.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                disabled={loading} autoFocus />
            </div>
          </div>
          {error && <div className="alert alert-danger"><AlertCircle size={14} />{error}</div>}
          <button type="submit" className="btn btn-primary auth-submit"
            disabled={loading || cooldown > 0}>
            <Mail size={16} />
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? 'Resend Code' : 'Send Reset Code'}
          </button>
        </form>

        {sent && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/reset-password" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>
              Enter reset code →
            </Link>
          </div>
        )}

        <p className="auth-switch"><Link to="/login">← Back to sign in</Link></p>
      </div>
    </div>
  );
}
