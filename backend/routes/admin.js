const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// ── GET /api/admin/users — all users with session stats ──────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u."isActive",
        u."authProvider",
        u."companyName",
        u."createdAt",
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

// ── GET /api/admin/users/:id/sessions ────────────────────────────────────────
router.get('/users/:id/sessions', async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const sessions = await prisma.$queryRaw`
      SELECT id, date, "startTime" AS start_time, "endTime" AS end_time,
             "durationMinutes" AS duration_minutes, status, remarks
      FROM "OtSession"
      WHERE "userId" = ${userId}
      ORDER BY date DESC, "startTime" DESC
    `;
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// ── PATCH /api/admin/users/:id — toggle isActive ─────────────────────────────
router.patch('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive (boolean) required.' });
  try {
    await prisma.$executeRaw`UPDATE "User" SET "isActive" = ${isActive} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

module.exports = router;
