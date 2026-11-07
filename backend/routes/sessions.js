const express = require('express');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require auth
router.use(auth);

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcDurationMins(date, startTime, endTime) {
  const startDT = new Date(`${date}T${startTime}`);
  let endDT = new Date(`${date}T${endTime}`);
  if (endDT < startDT) endDT.setDate(endDT.getDate() + 1); // overnight
  return Math.max(0, Math.round((endDT - startDT) / 60000));
}

function formatHours(mins) {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

// Serialize Prisma session to match old API shape (camelCase → snake_case)
function serialize(s) {
  if (!s) return null;
  return {
    id:               s.id,
    date:             s.date,
    start_time:       s.startTime,
    end_time:         s.endTime,
    duration_minutes: s.durationMinutes,
    status:           s.status,
    remarks:          s.remarks,
    created_at:       s.createdAt,
  };
}

// ── GET /api/sessions ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { date, month, search } = req.query;
  const userId = req.user.id;

  const where = { userId };

  if (date)  where.date = date;
  if (month) where.date = { startsWith: month };
  if (search) {
    where.OR = [
      { remarks:   { contains: search, mode: 'insensitive' } },
      { date:      { contains: search } },
      { startTime: { contains: search } },
    ];
  }

  try {
    const sessions = await prisma.otSession.findMany({
      where,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });
    res.json(sessions.map(serialize));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// ── GET /api/sessions/active ──────────────────────────────────────────────────
router.get('/active', async (req, res) => {
  try {
    const session = await prisma.otSession.findFirst({
      where: { userId: req.user.id, status: 'active' },
      orderBy: { id: 'desc' },
    });
    res.json(serialize(session));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = todayStr.substring(0, 7);

  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const weekStart = monday.toISOString().split('T')[0];

  try {
    const [allSessions, monthSessions, weekSessions, todaySessions, count] = await Promise.all([
      prisma.otSession.aggregate({ where: { userId, status: 'completed' }, _sum: { durationMinutes: true } }),
      prisma.otSession.aggregate({ where: { userId, status: 'completed', date: { startsWith: monthStr } }, _sum: { durationMinutes: true } }),
      prisma.otSession.aggregate({ where: { userId, status: 'completed', date: { gte: weekStart } }, _sum: { durationMinutes: true } }),
      prisma.otSession.aggregate({ where: { userId, status: 'completed', date: todayStr }, _sum: { durationMinutes: true } }),
      prisma.otSession.count({ where: { userId, status: 'completed' } }),
    ]);

    res.json({
      totalMins:     allSessions._sum.durationMinutes   || 0,
      monthMins:     monthSessions._sum.durationMinutes || 0,
      weekMins:      weekSessions._sum.durationMinutes  || 0,
      todayMins:     todaySessions._sum.durationMinutes || 0,
      totalSessions: count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── POST /api/sessions/start ──────────────────────────────────────────────────
router.post('/start', async (req, res) => {
  const { date, start_time } = req.body;
  if (!date || !start_time)
    return res.status(400).json({ error: 'date and start_time are required' });

  try {
    const active = await prisma.otSession.findFirst({
      where: { userId: req.user.id, status: 'active' },
    });
    if (active)
      return res.status(409).json({ error: 'An active session already exists', session: serialize(active) });

    const session = await prisma.otSession.create({
      data: { userId: req.user.id, date, startTime: start_time, status: 'active' },
    });
    res.status(201).json(serialize(session));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// ── POST /api/sessions/:id/end ────────────────────────────────────────────────
router.post('/:id/end', async (req, res) => {
  const id = parseInt(req.params.id);
  const { end_time, remarks } = req.body;
  if (!end_time) return res.status(400).json({ error: 'end_time is required' });

  try {
    const session = await prisma.otSession.findFirst({ where: { id, userId: req.user.id } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session is not active' });

    const duration = calcDurationMins(session.date, session.startTime, end_time);
    const updated = await prisma.otSession.update({
      where: { id },
      data: { endTime: end_time, durationMinutes: duration, status: 'completed', remarks: remarks || '' },
    });
    res.json(serialize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ── PUT /api/sessions/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { date, start_time, end_time, remarks } = req.body;

  try {
    const session = await prisma.otSession.findFirst({ where: { id, userId: req.user.id } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const newDate    = date       || session.date;
    const newStart   = start_time || session.startTime;
    const newEnd     = end_time !== undefined ? end_time : session.endTime;
    const newRemarks = remarks  !== undefined ? remarks  : session.remarks;

    let duration = session.durationMinutes;
    let status   = session.status;

    if (newEnd) {
      duration = calcDurationMins(newDate, newStart, newEnd);
      status   = 'completed';
    }

    const updated = await prisma.otSession.update({
      where: { id },
      data: { date: newDate, startTime: newStart, endTime: newEnd, durationMinutes: duration, status, remarks: newRemarks },
    });
    res.json(serialize(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// ── DELETE /api/sessions/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const session = await prisma.otSession.findFirst({ where: { id, userId: req.user.id } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await prisma.otSession.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ── GET /api/sessions/export ──────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  const { date, month, search } = req.query;
  const userId = req.user.id;

  const where = { userId, status: 'completed' };
  if (date)  where.date = date;
  if (month) where.date = { startsWith: month };
  if (search) {
    where.OR = [
      { remarks: { contains: search, mode: 'insensitive' } },
      { date:    { contains: search } },
    ];
  }

  try {
    const rows = await prisma.otSession.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SHIRA AI';
    const sheet = workbook.addWorksheet('OT Records');

    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'SHIRA OT TRACKER – Export';
    titleCell.font  = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    const headerRow = sheet.addRow(['Date', 'Start Time', 'End Time', 'OT Hours', 'Duration', 'Remarks']);
    headerRow.eachCell(cell => {
      cell.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheet.getRow(2).height = 22;

    let totalMins = 0;
    rows.forEach((r, i) => {
      const mins = r.durationMinutes || 0;
      totalMins += mins;
      const h = Math.floor(mins / 60), m = mins % 60;
      const row = sheet.addRow([
        r.date, r.startTime, r.endTime || '',
        parseFloat((mins / 60).toFixed(2)),
        `${h}h ${String(m).padStart(2, '0')}m`,
        r.remarks || '',
      ]);
      const fill = i % 2 === 0 ? 'FFFAFAFA' : 'FFEFEFFF';
      row.eachCell(cell => {
        cell.font      = { name: 'Calibri', size: 10 };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.height = 18;
    });

    const th = Math.floor(totalMins / 60), tm = totalMins % 60;
    const totalRow = sheet.addRow(['TOTAL', '', '', parseFloat((totalMins / 60).toFixed(2)), `${th}h ${String(tm).padStart(2, '0')}m`, `${rows.length} sessions`]);
    totalRow.eachCell(cell => {
      cell.font      = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    totalRow.height = 22;
    sheet.columns = [{ width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 28 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="OT_Export_${new Date().toISOString().split('T')[0]}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
