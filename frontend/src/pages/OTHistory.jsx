import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Pencil, X, Check, Download, Filter } from 'lucide-react';
import { getSessions, updateSession, deleteSession, getExportUrl } from '../api.js';

function formatHours(mins) {
  if (mins === null || mins === undefined) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function nowMonthStr() {
  return new Date().toISOString().substring(0, 7);
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ session, onSave, onClose }) {
  const [form, setForm] = useState({
    date:       session.date,
    start_time: session.start_time,
    end_time:   session.end_time || '',
    remarks:    session.remarks || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.date || !form.start_time) {
      setError('Date and Start Time are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await updateSession(session.id, form);
      onSave(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Edit OT Record #{session.id}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" step="1" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" step="1" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Remarks</label>
            <input type="text" value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional notes…" style={{ width: '100%' }} />
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '10px' }}>{error}</div>
        )}

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Check size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '360px' }}>
        <div className="modal-title">Delete Record</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          This will permanently delete this OT record. This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main History Page ─────────────────────────────────────────────────────────
export default function OTHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim())   params.search = search.trim();
      if (filterDate)      params.date   = filterDate;
      if (filterMonth)     params.month  = filterMonth;
      const res = await getSessions(params);
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, filterDate, filterMonth]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleEdit = (session) => setEditTarget(session);

  const handleSaved = (updated) => {
    setSessions(s => s.map(x => x.id === updated.id ? updated : x));
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget);
      setSessions(s => s.filter(x => x.id !== deleteTarget));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterDate('');
    setFilterMonth('');
  };

  const hasFilters = search || filterDate || filterMonth;

  // Build export URL with current filters
  const exportUrl = getExportUrl({
    ...(search.trim() && { search: search.trim() }),
    ...(filterDate    && { date: filterDate }),
    ...(filterMonth   && { month: filterMonth }),
  });

  // Total duration of visible completed sessions
  const totalMins = sessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

  return (
    <div>
      {/* Filter bar */}
      <div className="section-card" style={{ paddingBottom: '16px' }}>
        <div className="filter-bar">
          {/* Search */}
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search remarks, date…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Date filter */}
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); }}
            />
          </div>

          {/* Month filter */}
          <div className="form-group">
            <label>Month</label>
            <input
              type="month"
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
            />
          </div>

          {hasFilters && (
            <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
              <X size={12} /> Clear
            </button>
          )}

          {/* Export button */}
          <a
            href={exportUrl}
            download
            className="btn btn-excel"
            style={{ alignSelf: 'flex-end', marginBottom: '1px', textDecoration: 'none' }}
          >
            <Download size={14} />
            Export to Excel
          </a>
        </div>

        {/* Summary row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{sessions.filter(s => s.status === 'completed').length}</strong> completed record{sessions.filter(s => s.status === 'completed').length !== 1 ? 's' : ''}
            {sessions.some(s => s.status === 'active') && (
              <span style={{ marginLeft: '8px', color: 'var(--warning)' }}>
                + {sessions.filter(s => s.status === 'active').length} active
              </span>
            )}
          </span>
          {totalMins > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Total: <strong style={{ color: 'var(--primary)' }}>{formatHours(totalMins)}</strong>
              <span style={{ marginLeft: '6px', color: 'var(--text-light)' }}>({(totalMins / 60).toFixed(2)} hrs)</span>
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <Filter size={40} />
            <p style={{ marginTop: '12px', fontWeight: 600 }}>No records found</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              {hasFilters ? 'Try clearing your filters.' : 'Start your first OT session from the Tracker page.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{s.date}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.start_time}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.end_time || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatHours(s.duration_minutes)}
                    </td>
                    <td>
                      {s.status === 'completed'
                        ? <span className="badge badge-success">Completed</span>
                        : <span className="badge badge-warning">Active</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.remarks || <span style={{ color: 'var(--text-light)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleEdit(s)}
                          title="Edit"
                          style={{ padding: '5px 9px' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteTarget(s.id)}
                          title="Delete"
                          style={{ padding: '5px 9px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal
          session={editTarget}
          onSave={handleSaved}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
