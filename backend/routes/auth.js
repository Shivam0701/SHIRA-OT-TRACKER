const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const passport  = require('passport');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const audit     = require('../lib/audit');
const { sendOtpEmail, sendWelcomeEmail } = require('../lib/email');

const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'connect.shiraai@gmail.com';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

// ── Rate limiters ─────────────────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function sendAuth(res, statusCode, userData, token) {
  res.cookie('token', token, COOKIE_OPTS);
  res.status(statusCode).json({ ...userData, token });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function invalidatePreviousOtps(userId, purpose) {
  await prisma.otpToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data:  { usedAt: new Date() },
  });
}

async function createOtpRecord(userId, otp, purpose) {
  await invalidatePreviousOtps(userId, purpose);
  const tokenHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  return prisma.otpToken.create({
    data: { userId, tokenHash, purpose, expiresAt },
  });
}

async function verifyOtp(userId, otp, purpose) {
  // Get the latest unused, unexpired token for this user/purpose
  const record = await prisma.otpToken.findFirst({
    where: {
      userId,
      purpose,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { ok: false, reason: 'expired' };
  if (record.attempts >= 5) return { ok: false, reason: 'max_attempts' };

  const match = await bcrypt.compare(otp, record.tokenHash);

  if (!match) {
    await prisma.otpToken.update({
      where: { id: record.id },
      data:  { attempts: { increment: 1 } },
    });
    const remaining = 4 - record.attempts;
    return { ok: false, reason: 'wrong', remaining: Math.max(0, remaining) };
  }

  // Mark as used
  await prisma.otpToken.update({
    where: { id: record.id },
    data:  { usedAt: new Date() },
  });
  return { ok: true };
}

// ── POST /api/auth/send-otp  (register step 1) ────────────────────────────────
router.post('/send-otp', otpLimiter, async (req, res) => {
  const { name, email, companyName } = req.body;

  if (!name?.trim())  return res.status(400).json({ error: 'Full name is required.' });
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  const lowerEmail = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });

    if (existing?.emailVerified) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Enforce 60-second resend cooldown
    if (existing && !existing.emailVerified) {
      const lastOtp = await prisma.otpToken.findFirst({
        where: { userId: existing.id, purpose: 'register', usedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (lastOtp) {
        const secondsAgo = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
        if (secondsAgo < 60) {
          return res.status(429).json({
            error: 'Please wait before requesting a new code.',
            waitSeconds: Math.ceil(60 - secondsAgo),
          });
        }
      }
    }

    // Create or update pending user (unverified)
    let user = existing;
    if (!user) {
      const role = lowerEmail === ADMIN_EMAIL ? 'admin' : 'user';
      user = await prisma.user.create({
        data: {
          name:          name.trim(),
          email:         lowerEmail,
          companyName:   companyName?.trim() || null,
          role,
          authProvider:  'email',
          emailVerified: false,
        },
      });
    } else {
      // Update name/company in case they changed it
      await prisma.user.update({
        where: { id: user.id },
        data:  { name: name.trim(), companyName: companyName?.trim() || null },
      });
    }

    const otp = generateOtp();
    await createOtpRecord(user.id, otp, 'register');
    await sendOtpEmail({ to: lowerEmail, name: name.trim(), otp, purpose: 'register' });
    await audit('otp_sent', { actorId: user.id, ip: getIp(req), meta: { email: lowerEmail, purpose: 'register' } });

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp  (register step 2) ─────────────────────────────
router.post('/verify-otp', otpLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'Account not found. Please register first.' });

    const result = await verifyOtp(user.id, otp.trim(), 'register');

    if (!result.ok) {
      if (result.reason === 'expired')      return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
      if (result.reason === 'max_attempts') return res.status(400).json({ error: 'Too many wrong attempts. Request a new code.' });
      return res.status(400).json({ error: `Incorrect code. ${result.remaining} attempt${result.remaining !== 1 ? 's' : ''} remaining.` });
    }

    // Issue a short-lived setup token so set-password step is authenticated
    const setupToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'setup' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    await audit('otp_verified', { actorId: user.id, ip: getIp(req), meta: { email: user.email } });
    res.json({ success: true, setupToken });
  } catch (err) {
    console.error('verify-otp error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/set-password  (register step 3) ───────────────────────────
router.post('/set-password', async (req, res) => {
  const { setupToken, password } = req.body;
  if (!setupToken || !password) return res.status(400).json({ error: 'Setup token and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  let payload;
  try {
    payload = jwt.verify(setupToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Setup session expired. Please start registration again.' });
  }

  if (payload.purpose !== 'setup') return res.status(401).json({ error: 'Invalid setup token.' });

  try {
    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.update({
      where: { id: payload.userId },
      data:  { password: hashed, emailVerified: true },
    });

    const token = signToken(user);
    await audit('register', { actorId: user.id, ip: getIp(req), meta: { email: user.email } });
    // Send welcome email async — don't block the response
    sendWelcomeEmail({ to: user.email, name: user.name }).catch(e => console.error('Welcome email failed:', e.message));
    sendAuth(res, 201, { id: user.id, name: user.name, email: user.email, role: user.role }, token);
  } catch (err) {
    console.error('set-password error:', err.message);
    res.status(500).json({ error: 'Failed to activate account. Please try again.' });
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

    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
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
    await audit('login_success', { actorId: user.id, ip: getIp(req) });
    sendAuth(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role }, token);
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

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' });

  // Always respond the same to prevent email enumeration
  res.json({ success: true, message: 'If an account exists, a reset code has been sent.' });

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.password || !user.emailVerified) return; // silently skip

    const lastOtp = await prisma.otpToken.findFirst({
      where: { userId: user.id, purpose: 'reset', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (lastOtp) {
      const secondsAgo = (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000;
      if (secondsAgo < 60) return; // cooldown — silently skip
    }

    const otp = generateOtp();
    await createOtpRecord(user.id, otp, 'reset');
    await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: 'reset' });
    await audit('password_reset_requested', { actorId: user.id, ip: getIp(req) });
  } catch (err) {
    console.error('forgot-password error:', err.message);
  }
});

// ── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
router.post('/verify-reset-otp', otpLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    const result = await verifyOtp(user.id, otp.trim(), 'reset');
    if (!result.ok) {
      if (result.reason === 'expired')      return res.status(400).json({ error: 'Code has expired. Request a new one.' });
      if (result.reason === 'max_attempts') return res.status(400).json({ error: 'Too many wrong attempts. Request a new code.' });
      return res.status(400).json({ error: `Incorrect code. ${result.remaining} attempt${result.remaining !== 1 ? 's' : ''} remaining.` });
    }

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    res.json({ success: true, resetToken });
  } catch (err) {
    console.error('verify-reset-otp error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) return res.status(400).json({ error: 'Reset token and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Reset session expired. Please start over.' });
  }
  if (payload.purpose !== 'reset') return res.status(401).json({ error: 'Invalid reset token.' });

  try {
    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.update({
      where: { id: payload.userId },
      data:  { password: hashed },
    });

    const token = signToken(user);
    await audit('password_reset', { actorId: user.id, ip: getIp(req) });
    sendAuth(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role }, token);
  } catch (err) {
    console.error('reset-password error:', err.message);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: false })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false, state: false }, async (err, user, info) => {
      if (err) {
        console.error('[Google OAuth] Strategy error:', err.message);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
      }
      if (!user) {
        console.warn('[Google OAuth] No user returned:', info?.message || 'unknown reason');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
      }
      try {
        const onetimeToken = signToken(user);
        await audit('login_google', { actorId: user.id, ip: getIp(req), meta: { email: user.email } });
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${onetimeToken}`);
      } catch (callbackErr) {
        console.error('[Google OAuth] Callback error:', callbackErr.message);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`);
      }
    })(req, res, next);
  }
);

router.post('/google/token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required.' });
  try {
    const payload    = jwt.verify(token, process.env.JWT_SECRET);
    const freshToken = jwt.sign(
      { userId: payload.userId, email: payload.email, name: payload.name, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    sendAuth(res, 200, { id: payload.userId, name: payload.name, email: payload.email, role: payload.role }, freshToken);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// ── POST /api/auth/complete-profile ──────────────────────────────────────────
router.post('/complete-profile', async (req, res) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Invalid or expired token.' }); }

  const { companyName } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data:  { companyName: companyName?.trim() || null },
    });
    const freshToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await audit('profile_complete', { actorId: user.id, ip: getIp(req), meta: { email: user.email } });
    sendAuth(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role }, freshToken);
  } catch (err) {
    console.error('Complete profile error:', err.message);
    res.status(500).json({ error: 'Failed to save profile. Please try again.' });
  }
});

module.exports = router;
