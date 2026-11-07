import React, { useEffect, useState, useCallback } from 'react';
import { Users, Clock, TrendingUp, Zap, Calendar, Timer, RefreshCw } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function fmt(mins) {
  if (!mins) return '0h 00m';
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}
function dec(mins) { return mins ? (mins / 60).toFixed(2) : '0.00'; }

function StatCard({ icon, label, value, sub, accent, featured }) {
  return (
    <div style={{
      background: featured ? 'var(--primary)' : 'var(--bg-card)',
      border: `1px solid ${featured ? 'var(--primary)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: featured ? '0 4px 20px rgba(99,102,241,0.3)' : 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: featured ? 'rgba(255,255,255,0.15)' : `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: featured ? '#fff' : accent, flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: featured ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: featured ? '#fff' : 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
      <RefreshCw size={16} className="spin" /> Loading…
    </div>
  );

  const cards = [
    { icon: <Clock size={18} />,     label: 'Total OT Hours',    value: fmt(stats?.totalMins),   sub: `${dec(stats?.totalMins)} hrs across all users`, accent: 'var(--primary)', featured: true },
    { icon: <Users size={18} />,     label: 'Total Users',       value: stats?.totalUsers ?? 0,  sub: 'Registered accounts',      accent: 'var(--success)' },
    { icon: <TrendingUp size={18}/>, label: 'Total Sessions',     value: stats?.totalSessions??0, sub: 'Completed OT sessions',    accent: 'var(--warning)' },
    { icon: <Zap size={18} />,       label: 'Active Now',        value: stats?.activeSessions??0,sub: 'Sessions currently running',accent: '#f43f5e' },
    { icon: <Calendar size={18} />,  label: 'This Month',        value: fmt(stats?.monthMins),   sub: `${dec(stats?.monthMins)} hrs`,  accent: 'var(--primary)' },
    { icon: <Timer size={18} />,     label: "Today's Total",     value: fmt(stats?.todayMins),   sub: `${dec(stats?.todayMins)} hrs`,  accent: 'var(--success)' },
  ];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #818cf8 100%)',
        borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Welcome back, {user?.name?.split(' ')[0]} 👋</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Here's a live overview of the SHIRA OT Tracker platform.
          </div>
        </div>
        <button onClick={fetch} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Quick info */}
      <div className="section-card">
        <div className="section-title">
          <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          Platform Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Avg OT per user',    value: stats?.totalUsers ? fmt(Math.round(stats.totalMins / stats.totalUsers)) : '—' },
            { label: 'Avg per session',    value: stats?.totalSessions ? fmt(Math.round(stats.totalMins / stats.totalSessions)) : '—' },
            { label: 'Total hours (dec)',  value: `${dec(stats?.totalMins)} hrs` },
            { label: 'Month hours (dec)',  value: `${dec(stats?.monthMins)} hrs` },
          ].map((item, i) => (
            <div key={i} className="mini-card">
              <div className="mini-card-label">{item.label}</div>
              <div className="mini-card-value">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
