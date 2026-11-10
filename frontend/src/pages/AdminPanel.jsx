import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Clock, RefreshCw, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Trash2, Download, Pencil, X,
  AlertTriangle, Mail, UserX,
} from 'lucide-react';
import api from '../api.js';

function fmt(mins) {
  if (!mins) return '0h 00m';
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

// ── Inline confirm delete ──────────────────────────────────────────────────────
function DeleteBtn({ onConfirm, small, label }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button onClick={onConfirm} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 5, padding: small ? '2px 8px' : '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Yes</button>
      <button onClick={() => setConfirm(false)} style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5, padding: small ? '2px 6px' : '4px 8px', cursor: 'pointer', fontSize: 11 }}>No</button>
    </span>
  );
  return (
    <button onClick={() => setConfirm(true)} title={label || 'Delete'}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontSize: 12 }}>
      <Trash2 size={small ? 13 : 15} />
      {label && <span>{label}</span>}
    </button>
  );
}

// ── Edit session modal ─────────────────────────────────────────────────────────
function EditSessionModal({ session, onSave, onClose }) {
  const [form, setForm] = useState({
    date:       session.date,
    start_time: session.start_time,
    end_time:   session.end_time || '',
    remarks:    session.remarks || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/sessions/${session.id}`, form);
      onSave({ ...session, ...form });
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, width: 360, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Edit Session</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        {[
          { label: 'Date',       key: 'date',       type: 'date' },
          { label: 'Start Time', key: 'start_time', type: 'time' },
          { label: 'End Time',   key: 'end_time',   type: 'time' },
        ].map(({ label, key, type }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 13 }} />
          </div>
        ))}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Remarks</label>
          <input type="text" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stage badge ────────────────────────────────────────────────────────────────
function StageBadge({ stage }) {
  const map = {
    awaiting_otp:  { label: 'Awaiting OTP',      bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
    otp_expired:   { label: 'OTP Expired',        bg: 'rgba(239,68,68,0.10)', color: 'var(--danger)' },
    otp_verified:  { label: 'OTP ✓, No Password', bg: 'rgba(99,102,241,0.12)', color: 'var(--primary)' },
  };
  const { label, bg, color } = map[stage] || { label: stage, bg: 'var(--bg-input)', color: 'var(--text-muted)' };
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: bg, color, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [sessions, setSessions]       = useState({});
  const [toggling, setToggling]       = useState(null);
  const [editSession, setEditSession] = useState(null);

  // Pending registrations state
  const [pending, setPending]           = useState([]);
  const [pendingLoading, setPendingLoad] = useState(false);
  const [showPending, setShowPending]   = useState(false);
  const [cleaning, setCleaning]         = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchPending = useCallback(async () => {
    setPendingLoad(true);
    try {
      const res = await api.get('/admin/pending');
      setPending(res.data);
    } catch (e) { console.error(e); }
    finally { setPendingLoad(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchPending(); }, [fetchUsers, fetchPending]);

  // ── Verified users actions ────────────────────────────────────────────────
  const loadSessions = async (userId) => {
    if (sessions[userId]) return;
    try {
      const res = await api.get(`/admin/users/${userId}/sessions`);
      setSessions(s => ({ ...s, [userId]: res.data }));
    } catch { setSessions(s => ({ ...s, [userId]: [] })); }
  };

  const toggleExpand = (userId) => {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    loadSessions(userId);
  };

  const toggleActive = async (user) => {
    setToggling(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      setUsers(us => us.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch { /* ignore */ }
    setToggling(null);
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(us => us.filter(u => u.id !== userId));
      if (expanded === userId) setExpanded(null);
    } catch { /* ignore */ }
  };

  const deleteSession = async (sessionId, userId) => {
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      setSessions(s => ({ ...s, [userId]: s[userId].filter(x => x.id !== sessionId) }));
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { /* ignore */ }
  };

  const saveSession = (updated, userId) => {
    setSessions(s => ({ ...s, [userId]: s[userId].map(x => x.id === updated.id ? updated : x) }));
    setEditSession(null);
  };

  const exportUser = (userId) => {
    const token = localStorage.getItem('ot_token');
    fetch(`${BASE}/admin/users/${userId}/export`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `OT_export_user${userId}.xlsx`;
        a.click();
      });
  };

  // ── Pending actions ───────────────────────────────────────────────────────
  const deletePending = async (id) => {
    try {
      await api.delete(`/admin/pending/${id}`);
      setPending(p => p.filter(u => u.id !== id));
    } catch { /* ignore */ }
  };

  const cleanupAll = async () => {
    setCleaning(true);
    try {
      await api.delete('/admin/pending/cleanup');
      await fetchPending();
    } catch { /* ignore */ }
    setCleaning(false);
  };

  const th = (label) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: 'var(--bg-input)' }}>
      {label}
    </th>
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 8 }}>
      <RefreshCw size={16} /> Loading…
    </div>
  );

  return (
    <div>
      {editSession && (
        <EditSessionModal
          session={editSession.session}
          onSave={(updated) => saveSession(updated, editSession.userId)}
          onClose={() => setEditSession(null)}
        />
      )}

      {/* ── Pending Registrations section ─────────────────────────────────── */}
      <div className="section-card" style={{ marginBottom: 20, borderColor: pending.length ? 'rgba(245,158,11,0.35)' : 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => { setShowPending(v => !v); if (!showPending) fetchPending(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
            <AlertTriangle size={15} style={{ color: pending.length ? '#d97706' : 'var(--text-muted)' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: pending.length ? '#d97706' : 'var(--text-muted)' }}>
              Pending Registrations ({pending.length})
            </span>
            {showPending ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {pending.length > 0 && (
            <button onClick={cleanupAll} disabled={cleaning}
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '5px 12px', color: '#d97706', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, opacity: cleaning ? 0.6 : 1 }}>
              <Trash2 size={12} /> {cleaning ? 'Cleaning…' : 'Clean up stale (>24h)'}
            </button>
          )}
        </div>

        {showPending && (
          <div style={{ marginTop: 16 }}>
            {pendingLoading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} /> Loading…
              </div>
            ) : pending.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                ✅ No pending registrations.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>{[th('Name'), th('Email'), th('Company'), th('Stage'), th('Started'), th('Action')]}</tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <UserX size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            {u.name}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 12 }}>
                            <Mail size={11} />
                            {u.email}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{u.companyName || '—'}</td>
                        <td style={{ padding: '10px 14px' }}><StageBadge stage={u.stage} /></td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <DeleteBtn small label="Delete" onConfirm={() => deletePending(u.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                  ℹ️ "Clean up stale" removes records older than 24 hours. Individual delete removes immediately.
                  Verified users are never affected.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Verified Users section ─────────────────────────────────────────── */}
      <div className="section-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <Users size={16} style={{ color: 'var(--primary)' }} />
            Verified Users ({users.length})
          </div>
          <button onClick={fetchUsers} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[th('Name'), th('Email'), th('Company'), th('Auth'), th('Role'), th('Sessions'), th('Total OT'), th('Status'), th('Actions')]}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{u.companyName || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                        background: u.authProvider === 'google' ? 'rgba(234,67,53,0.12)' : 'var(--primary-bg)',
                        color: u.authProvider === 'google' ? '#ea4335' : 'var(--primary)' }}>
                        {u.authProvider}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)',
                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>{u.totalSessions}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary)' }}>{fmt(u.totalMins)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => toggleActive(u)} disabled={toggling === u.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, color: u.isActive ? 'var(--success)' : 'var(--danger)' }}>
                        {u.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        <span style={{ fontSize: 11 }}>{u.isActive ? 'Active' : 'Suspended'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => toggleExpand(u.id)} title="View sessions"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
                          {expanded === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button onClick={() => exportUser(u.id)} title="Export Excel"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)', display: 'flex', padding: 0 }}>
                          <Download size={15} />
                        </button>
                        <DeleteBtn onConfirm={() => deleteUser(u.id)} />
                      </div>
                    </td>
                  </tr>

                  {expanded === u.id && (
                    <tr>
                      <td colSpan={9} style={{ background: 'var(--bg-input)', padding: '0 14px 16px' }}>
                        <div style={{ paddingTop: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 700, fontSize: 13 }}>Sessions — {u.name}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                              {sessions[u.id]?.length ?? '…'} sessions
                            </span>
                          </div>
                          {!sessions[u.id] ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading…</span>
                          ) : sessions[u.id].length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No sessions yet.</span>
                          ) : (
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr>
                                    {['Date','Start','End','Duration','Status','Remarks','Actions'].map(h => (
                                      <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {sessions[u.id].map(s => (
                                    <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                                      <td style={{ padding: '8px 10px' }}>{s.date}</td>
                                      <td style={{ padding: '8px 10px' }}>{s.start_time}</td>
                                      <td style={{ padding: '8px 10px' }}>{s.end_time || '—'}</td>
                                      <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--primary)' }}>{fmt(s.duration_minutes)}</td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 99,
                                          background: s.status === 'completed' ? 'var(--success-bg)' : 'var(--warning-bg)',
                                          color: s.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                                          {s.status}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.remarks || '—'}
                                      </td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                          <button onClick={() => setEditSession({ session: s, userId: u.id })} title="Edit"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}>
                                            <Pencil size={13} />
                                          </button>
                                          <DeleteBtn small onConfirm={() => deleteSession(s.id, u.id)} />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
