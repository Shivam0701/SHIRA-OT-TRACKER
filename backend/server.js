require('dotenv').config();
const express        = require('express');
const cors           = require('cors');
const cookieParser   = require('cookie-parser');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const authRoutes    = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');

const app    = express();
const prisma = new PrismaClient();
const PORT   = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
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

      // Try to find existing user by googleId first, then by email
      let user = await prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
      });

      if (user) {
        // Link googleId + update avatar if they signed up via email before
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            avatar,
            authProvider: 'google',
          },
        });
      } else {
        // New user — create account
        const role = email === ADMIN_EMAIL ? 'admin' : 'user';
        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            avatar,
            role,
            authProvider: 'google',
            // password is null for Google users
          },
        });
      }

      if (!user.isActive) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

app.use(passport.initialize());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/sessions', sessionRoutes);

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
