import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Clock, CalendarDays, MessageSquare, AlertCircle } from 'lucide-react';
import { getActiveSession, startSession, endSession } from '../api.js';
import Character from '../components/Character.jsx';

function pad(n) { return String(n).padStart(2, '0'); }

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatHours(mins) {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function nowDateStr() { return new Date().toISOString().split('T')[0]; }
function nowTimeStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getCharState({ loading, activeSession, elapsed, dateChanged, justEnded }) {
  if (loading)          return { state: 'idle',    label: 'Getting ready...' };
  if (justEnded)        return { state: 'done',    label: 'Nice work!' };
  if (activeSession) {
    return elapsed > 8
      ? { state: 'typing',   label: 'On the grind!' }
      : { state: 'working',  label: "Let's get it!" };
  }
  if (dateChanged)      return { state: 'date',    label: 'Checking dates...' };
  return                       { state: 'idle',    label: 'Chillin with coffee' };
}

export default function Tracker() {
  const [selectedDate, setSelectedDate]   = useState(nowDateStr());
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed]             = useState(0);
  const [remarks, setRemarks]             = useState('');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [ending, setEnding]               = useState(false);
  const [dateChanged, setDateChanged]     = useState(false);
  const [justEnded, setJustEnded]         = useState(false);
  const intervalRef   = useRef(null);
  const endTimerRef   = useRef(null);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const fetchActive = useCallback(async () => {
    try {
      const res = await getActiveSession();
      setActiveSession(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  useEffect(() => {
    if (!activeSession) {
      clearInterval(intervalRef.current);
      setElapsed(0);
      return;
    }
    const calcElapsed = () => {
      const start = new Date(`${activeSession.date}T${activeSession.start_time}`);
      setElapsed(Math.max(0, Math.floor((new Date() - start) / 1000)));
    };
    calcElapsed();
    intervalRef.current = setInterval(calcElapsed, 1000);
    return () => clearInterval(intervalRef.current);
  }, [activeSession]);

  const handleDateChange = (val) => {
    setSelectedDate(val);
    setDateChanged(true);
  };

  const handleStart = async () => {
    clearMessages();
    setDateChanged(false);
    setJustEnded(false);
    const time = nowTimeStr();
    try {
      const res = await startSession({ date: selectedDate, start_time: time });
      setActiveSession(res.data);
      setSuccess(`✅ OT started at ${time} on ${selectedDate}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start session');
    }
  };

  const handleEnd = async () => {
    if (!activeSession) return;
    setEnding(true);
    clearMessages();
    const time = nowTimeStr();
    try {
      const res = await endSession(activeSession.id, { end_time: time, remarks });
      setSuccess(`✅ OT ended at ${time}. Duration: ${formatHours(res.data.duration_minutes)}`);
      setActiveSession(null);
      setRemarks('');
      setJustEnded(true);
      // reset back to idle after 5s
      clearTimeout(endTimerRef.current);
      endTimerRef.current = setTimeout(() => setJustEnded(false), 5000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to end session');
    } finally {
      setEnding(false);
    }
  };

  const { state: charState, label: charLabel } = getCharState({
    loading,
    activeSession,
    elapsed,
    dateChanged,
    justEnded,
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="page-split">

      {/* ── Left: form ── */}
      <div className="page-split-form">

        {/* Date picker */}
        <div className="section-card">
          <div className="section-title">
            <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
            Select Date
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ot-date">OT Date</label>
              <input
                id="ot-date"
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                disabled={!!activeSession}
                max={nowDateStr()}
              />
            </div>
            {!activeSession && (
              <div style={{ paddingBottom: '1px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '24px' }}
                  onClick={() => handleDateChange(nowDateStr())}
                >
                  Today
                </button>
              </div>
            )}
          </div>
          {activeSession && (
            <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Date is locked while a session is active.
            </p>
          )}
        </div>

        {/* Timer */}
        <div className="section-card" style={{ textAlign: 'center' }}>
          <div className="section-title" style={{ justifyContent: 'center' }}>
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            {activeSession ? 'Session Running' : 'Ready to Start'}
          </div>

          <div className="timer-label">
            {activeSession
              ? `Started at ${activeSession.start_time} on ${activeSession.date}`
              : 'Press START OT to begin tracking'}
          </div>

          <div className="timer-display" style={{ marginBottom: '8px' }}>
            {activeSession ? formatElapsed(elapsed) : '00:00:00'}
          </div>

          {activeSession && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {formatHours(Math.floor(elapsed / 60))} elapsed
            </div>
          )}

          {activeSession && (
            <div className="form-group" style={{ marginTop: '18px', textAlign: 'left' }}>
              <label htmlFor="remarks">
                <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Remarks (optional)
              </label>
              <input
                id="remarks"
                type="text"
                placeholder="e.g. Deployment, Sprint work…"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
            {!activeSession ? (
              <button className="btn btn-success btn-lg" onClick={handleStart}>
                <Play size={18} />
                START OT
              </button>
            ) : (
              <button className="btn btn-danger btn-lg" onClick={handleEnd} disabled={ending}>
                <Square size={18} />
                {ending ? 'Ending…' : 'END OT'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '12px' }}>
            {success}
          </div>
        )}

        <div className="info-box">
          <strong>How it works:</strong><br />
          1. Pick your OT date (defaults to today).<br />
          2. Click <strong>START OT</strong> — timestamp captured automatically.<br />
          3. Click <strong>END OT</strong> — duration calculated, saved to database.<br />
          4. Multiple sessions per day and overnight sessions are supported.
        </div>
      </div>

      {/* ── Right: character ── */}
      <div className="page-split-char">
        <Character state={charState} label={charLabel} />
      </div>

    </div>
  );
}
