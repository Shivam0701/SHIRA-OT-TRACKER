import React, { useEffect, useState, useCallback } from 'react';
import { Clock, Calendar, CalendarDays, Timer, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import { getStats, getActiveSession } from '../api.js';

function formatHours(mins) {
  if (!mins && mins !== 0) return '0h 00m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatDecimal(mins) {
  if (!mins) return '0.00';
  return (mins / 60).toFixed(2);
}

function StatCard({ label, value, sub, icon, iconBg, iconColor, featured }) {
  return (
    <div className={`stat-card${featured ? ' featured' : ''}`}>
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveElapsed, setLiveElapsed] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, activeRes] = await Promise.all([getStats(), getActiveSession()]);
      setStats(statsRes.data);
      setActiveSession(activeRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!activeSession) { setLiveElapsed(0); return; }
    const calc = () => {
      const start = new Date(`${activeSession.date} ${activeSession.start_time}`);
      const diff = Math.max(0, Math.floor((new Date() - start) / 60000));
      setLiveElapsed(diff);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [activeSession]);

  useEffect(() => {
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} />
          Loading…
        </div>
      </div>
    );
  }

  // All icon colors use CSS variables — no hardcoded hex
  const cards = [
    {
      label: 'Total OT Hours',
      value: formatHours(stats?.totalMins),
      sub: `${formatDecimal(stats?.totalMins)} hrs total`,
      icon: <Clock size={20} />,
      iconBg: 'var(--primary-bg)',
      iconColor: 'var(--primary)',
      featured: true,
    },
    {
      label: 'This Month',
      value: formatHours(stats?.monthMins),
      sub: `${formatDecimal(stats?.monthMins)} hrs`,
      icon: <Calendar size={18} />,
      iconBg: 'var(--success-bg)',
      iconColor: 'var(--success)',
    },
    {
      label: 'This Week',
      value: formatHours(stats?.weekMins),
      sub: `${formatDecimal(stats?.weekMins)} hrs`,
      icon: <CalendarDays size={18} />,
      iconBg: 'var(--warning-bg)',
      iconColor: 'var(--warning)',
    },
    {
      label: "Today's OT",
      value: formatHours(stats?.todayMins),
      sub: `${formatDecimal(stats?.todayMins)} hrs`,
      icon: <Timer size={18} />,
      iconBg: 'var(--pink-bg)',
      iconColor: 'var(--pink-color)',
    },
    {
      label: 'Total Sessions',
      value: stats?.totalSessions ?? 0,
      sub: 'Completed sessions',
      icon: <CheckCircle2 size={18} />,
      iconBg: 'var(--success-bg)',
      iconColor: 'var(--success)',
    },
  ];

  const summaryItems = [
    { label: 'Avg per session', value: stats?.totalSessions ? formatHours(Math.round(stats.totalMins / stats.totalSessions)) : '—' },
    { label: 'Today (decimal)',  value: `${formatDecimal(stats?.todayMins)} hrs` },
    { label: 'Week (decimal)',   value: `${formatDecimal(stats?.weekMins)} hrs` },
    { label: 'Month (decimal)',  value: `${formatDecimal(stats?.monthMins)} hrs` },
  ];

  return (
    <div>
      {activeSession && (
        <div className="active-session-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="active-dot" />
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>Session Running</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              — Started {activeSession.start_time} on {activeSession.date}
            </span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '15px', fontVariantNumeric: 'tabular-nums' }}>
            +{formatHours(liveElapsed)} elapsed
          </span>
        </div>
      )}

      <div className="cards-grid">
        {cards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      <div className="section-card">
        <div className="section-title">
          <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
          Quick Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {summaryItems.map((item, i) => (
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
