import React, { useEffect, useState, useCallback } from 'react';
import { Users, Clock, Building2, RefreshCw, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api.js';

function formatHours(mins) {
  if (!mins) return '0h 00m';
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

export default function AdminPanel() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [sessions, setSessions]   = useState({});
  const [toggling, setToggling]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleExpand = async (userId) => {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (!sessions[userId]) {
      try {
        const res = await api.get(`/admin/users/${userId}/sessions`);
        setSessions(s => ({ ...s, [userId]: res.data }));
      } catch { setSessions(s => ({ ...s, [userId]: [] })); }
    }
  };

  const toggleActive = async (user) => {
    setToggling(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      setUsers(us => us.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch { /* ignore */ }
    setToggling(null);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
      <RefreshCw size={16} /> Loading…
    </div>
  );

  return (
    <div>
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-title">
          <Users size={16} style={{ color: 'var(--primary)' }} />
          All Users ({users.length})
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {['Name', 'Email', 'Company', 'Auth', 'Role', 'Sessions', 'Total OT', 'Status', 'Sessions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{u.companyName || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: u.authProvider === 'google' ? 'rgba(234,67,53,0.12)' : 'var(--primary-bg)', color: u.authProvider === 'google' ? '#ea4335' : 'var(--primary)', fontWeight: 600 }}>
                        {u.authProvider}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: u.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)', color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>{u.totalSessions}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--primary)' }}>{formatHours(u.totalMins)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => toggleActive(u)} disabled={toggling === u.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: u.isActive ? 'var(--success)' : 'var(--danger)', padding: 0 }}>
                        {u.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        <span style={{ fontSize: 12 }}>{u.isActive ? 'Active' : 'Suspended'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => toggleExpand(u.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        {expanded === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        View
                      </button>
                    </td>
                  </tr>

                  {expanded === u.id && (
                    <tr>
                      <td colSpan={9} style={{ padding: '0 14px 16px', background: 'var(--bg-input)' }}>
                        <div style={{ paddingTop: 12, fontSize: 13 }}>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--text-muted)' }}>
                            <Clock size={13} /> Sessions for {u.name}
                          </strong>
                          {!sessions[u.id] ? (
                            <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
                          ) : sessions[u.id].length === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>No sessions yet.</span>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr style={{ color: 'var(--text-muted)' }}>
                                  {['Date', 'Start', 'End', 'Duration', 'Status', 'Remarks'].map(h => (
                                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sessions[u.id].map(s => (
                                  <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ padding: '7px 10px' }}>{s.date}</td>
                                    <td style={{ padding: '7px 10px' }}>{s.start_time}</td>
                                    <td style={{ padding: '7px 10px' }}>{s.end_time || '—'}</td>
                                    <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--primary)' }}>{formatHours(s.duration_minutes)}</td>
                                    <td style={{ padding: '7px 10px' }}>
                                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99, background: s.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)', color: s.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                                        {s.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{s.remarks || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
