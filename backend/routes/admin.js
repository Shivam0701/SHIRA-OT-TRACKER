const express = require('express');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth, adminOnly);

// ── GET /api/admin/stats — global platform stats ──────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT u.id)::int                                        AS "totalUsers",
        COUNT(DISTINCT CASE WHEN s.status='active' THEN s.id END)::int  AS "activeSessions",
        COUNT(DISTINCT CASE WHEN s.status='completed' THEN s.id END)::int AS "totalSessions",
        COALESCE(SUM(CASE WHEN s.status='completed' THEN s."durationMinutes" END),0)::int AS "totalMins",
        COALESCE(SUM(CASE WHEN s.status='completed' AND s.date >= TO_CHAR(NOW(),'YYYY-MM') || '-01' THEN s."durationMinutes" END),0)::int AS "monthMins",
        COALESCE(SUM(CASE WHEN s.status='completed' AND s.date = TO_CHAR(NOW(),'YYYY-MM-DD') THEN s."durationMinutes" END),0)::int AS "todayMins"
      FROM "User" u
      LEFT JOIN "OtSession" s ON s."userId" = u.id
    `;
    res.json(rows[0]);
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT
        u.id, u.name, u.email, u.role, u."isActive",
        u."authProvider", u."companyName", u."createdAt",
        COUNT(s.id)::int                           AS "totalSessions",
        COALESCE(SUM(s."durationMinutes"), 0)::int AS "totalMins"
      FROM "User" u
      LEFT JOIN "OtSession" s ON s."userId" = u.id AND s.status = 'completed'
      GROUP BY u.id
      ORDER BY u."createdAt" DESC
    `;
    res.json(users);
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' });
  try {
    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ── PATCH /api/admin/users/:id — update name / companyName / isActive / role ─
router.patch('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { isActive, name, companyName, role } = req.body;
  try {
    if (typeof isActive === 'boolean') {
      await prisma.$executeRaw`UPDATE "User" SET "isActive" = ${isActive} WHERE id = ${id}`;
    }
    if (name !== undefined) {
      await prisma.$executeRaw`UPDATE "User" SET name = ${name} WHERE id = ${id}`;
    }
    if (companyName !== undefined) {
      await prisma.$executeRaw`UPDATE "User" SET "companyName" = ${companyName} WHERE id = ${id}`;
    }
    if (role !== undefined && ['user','admin'].includes(role)) {
      await prisma.$executeRaw`UPDATE "User" SET role = ${role} WHERE id = ${id}`;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ── GET /api/admin/users/:id/sessions ────────────────────────────────────────
router.get('/users/:id/sessions', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const sessions = await prisma.$queryRaw`
      SELECT id, date,
             "startTime"       AS start_time,
             "endTime"         AS end_time,
             "durationMinutes" AS duration_minutes,
             status, remarks
      FROM "OtSession"
      WHERE "userId" = ${userId}
      ORDER BY date DESC, "startTime" DESC
    `;
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// ── PUT /api/admin/sessions/:id — update a session ───────────────────────────
router.put('/sessions/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { date, start_time, end_time, remarks } = req.body;
  try {
    // Recalculate duration if both times present
    let durationSql = '';
    if (start_time && end_time) {
      // duration computed in SQL
      await prisma.$executeRaw`
        UPDATE "OtSession"
        SET date = COALESCE(${date ?? null}, date),
            "startTime"  = ${start_time},
            "endTime"    = ${end_time},
            remarks      = COALESCE(${remarks ?? null}, remarks),
            "durationMinutes" = EXTRACT(EPOCH FROM (
              (date::date + ${end_time}::time) - (date::date + ${start_time}::time)
            )) / 60,
            status = 'completed',
            "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "OtSession"
        SET date    = COALESCE(${date ?? null}, date),
            remarks = COALESCE(${remarks ?? null}, remarks),
            "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Update session error:', err.message);
    res.status(500).json({ error: 'Failed to update session.' });
  }
});

// ── DELETE /api/admin/sessions/:id ───────────────────────────────────────────
router.delete('/sessions/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.$executeRaw`DELETE FROM "OtSession" WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session.' });
  }
});

// ── GET /api/admin/users/:id/export — Excel export for a user ────────────────
router.get('/users/:id/export', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const userRows = await prisma.$queryRaw`
      SELECT name, email FROM "User" WHERE id = ${userId}
    `;
    if (!userRows.length) return res.status(404).json({ error: 'User not found.' });
    const user = userRows[0];

    const sessions = await prisma.$queryRaw`
      SELECT date, "startTime", "endTime", "durationMinutes", status, remarks
      FROM "OtSession"
      WHERE "userId" = ${userId} AND status = 'completed'
      ORDER BY date ASC, "startTime" ASC
    `;

    const workbook  = new ExcelJS.Workbook();
    workbook.creator = 'SHIRA AI';
    const sheet = workbook.addWorksheet('OT Records');

    // Title row
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `SHIRA OT TRACKER — ${user.name} (${user.email})`;
    titleCell.font  = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Header
    const hdr = sheet.addRow(['Date', 'Start', 'End', 'OT Hours', 'Duration', 'Remarks']);
    hdr.eachCell(cell => {
      cell.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    sheet.getRow(2).height = 22;

    let totalMins = 0;
    sessions.forEach((s, i) => {
      const mins = s.durationMinutes || 0;
      totalMins += mins;
      const h = Math.floor(mins / 60), m = mins % 60;
      const row = sheet.addRow([
        s.date, s.startTime, s.endTime || '',
        parseFloat((mins / 60).toFixed(2)),
        `${h}h ${String(m).padStart(2,'0')}m`,
        s.remarks || '',
      ]);
      row.eachCell(cell => {
        cell.font = { size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFAFAFA' : 'FFEFEFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      row.height = 18;
    });

    // Total row
    const th = Math.floor(totalMins / 60), tm = totalMins % 60;
    const tot = sheet.addRow(['TOTAL', '', '', parseFloat((totalMins/60).toFixed(2)), `${th}h ${String(tm).padStart(2,'0')}m`, `${sessions.length} sessions`]);
    tot.eachCell(cell => {
      cell.font  = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    tot.height = 22;
    sheet.columns = [{ width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 30 }];

    const filename = `OT_${user.name.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Admin export error:', err.message);
    res.status(500).json({ error: 'Export failed.' });
  }
});

module.exports = router;
