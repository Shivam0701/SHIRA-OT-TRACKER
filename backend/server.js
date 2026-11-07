require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const authRoutes    = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const adminRoutes   = require('./routes/admin');

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3001;

// Trust Render/Vercel proxy so express-rate-limit reads the real client IP
app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://shira-ot-tracker.vercel.app',   // legacy Vercel domain
  'https://ottracker.shiraai.in',           // primary custom domain
  process.env.FRONTEND_URL,                 // env override (if set)
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ── Passport — Google OAuth strategy ─────────────────────────────────────────
const ADMIN_EMAIL = 'connect.shiraai@gmail.com';

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value?.toLowerCase();
      const googleId = profile.id;
      const name     = profile.displayName || profile.name?.givenName || 'User';
      const avatar   = profile.photos?.[0]?.value || null;

      if (!email) return done(new Error('No email from Google'), null);

      // Use raw SQL — avoids Prisma client/schema version mismatch on Render
      const rows = await prisma.$queryRaw`
        SELECT id, name, email, role, "isActive", "authProvider", phone
        FROM "User"
        WHERE "googleId" = ${googleId} OR email = ${email}
        LIMIT 1
      `;

      let user;

      if (rows.length > 0) {
        const existing = rows[0];
        // Ensure admin email always gets admin role
        const role = email === ADMIN_EMAIL ? 'admin' : existing.role;
        await prisma.$executeRaw`
          UPDATE "User"
          SET "googleId" = ${googleId}, avatar = ${avatar},
              "authProvider" = 'google', role = ${role}
          WHERE id = ${existing.id}
        `;
        user = { ...existing, googleId, avatar, authProvider: 'google', role };
      } else {
        // New user
        const role = email === ADMIN_EMAIL ? 'admin' : 'user';
        const created = await prisma.$queryRaw`
          INSERT INTO "User" (name, email, "googleId", avatar, role, "authProvider", "isActive", "createdAt", "updatedAt")
          VALUES (${name}, ${email}, ${googleId}, ${avatar}, ${role}, 'google', true, NOW(), NOW())
          RETURNING id, name, email, role, "isActive", "authProvider", phone
        `;
        user = created[0];
      }

      if (!user.isActive) return done(null, false);
      return done(null, user);
    } catch (err) {
      console.error('[Google OAuth] Strategy error:', err.message);
      return done(err, null);
    }
  }
));

app.use(passport.initialize());

// ── Health checks ─────────────────────────────────────────────────────────────
app.get('/health',  (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.get('/healthz', (_, res) => res.json({ status: 'ok', service: 'SHIRA OT Tracker' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin',    adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ SHIRA OT Tracker backend running on http://localhost:${PORT}`);
});
