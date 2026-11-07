const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const audit    = require('../lib/audit');

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'connect.shiraai@gmail.com';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, phone, companyName } = req.body;

  if (!name?.trim())    return res.status(400).json({ error: 'Full name is required.' });
  if (!email?.trim())   return res.status(400).json({ error: 'Email is required.' });
  if (!phone?.trim())   return res.status(400).json({ error: 'Contact number is required.' });
  if (!password)        return res.status(400).json({ error: 'Password is required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const role   = email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';

    const user = await prisma.user.create({
      data: {
        name:        name.trim(),
        email:       email.toLowerCase(),
        password:    hashed,
        phone:       phone.trim(),
        companyName: companyName?.trim() || null,
        role,
        authProvider: 'email',
      },
    });

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    await audit('register', { actorId: user.id, ip: getIp(req), meta: { email: user.email } });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.password) {
      await audit('login_failed', { ip: getIp(req), meta: { email } });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await audit('login_failed', { actorId: user.id, ip: getIp(req) });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    await audit('login_success', { actorId: user.id, ip: getIp(req) });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ success: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: payload.userId, name: payload.name, email: payload.email, role: payload.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ── GET /api/auth/google — kick off OAuth flow ────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// ── GET /api/auth/google/callback — Google redirects here ────────────────────
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  async (req, res) => {
    try {
      // req.user is set by passport strategy (see server.js)
      const token = signToken(req.user);
      res.cookie('token', token, COOKIE_OPTS);
      await audit('login_google', { actorId: req.user.id, ip: getIp(req), meta: { email: req.user.email } });
      res.redirect(`${process.env.FRONTEND_URL}/`);
    } catch (err) {
      console.error('Google callback error:', err.message);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
    }
  }
);

module.exports = router;
