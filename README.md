# SHIRA OT Tracker

Personal overtime tracker — upgraded to multi-user SaaS.

## Tech Stack
- **Frontend**: React + Vite → deployed on **Vercel**
- **Backend**: Node.js + Express → deployed on **Render**
- **Database**: PostgreSQL via **Prisma ORM**
- **Auth**: JWT in httpOnly cookies + bcrypt

---

## Local Development

### 1. Backend
```bash
cd backend
cp .env.example .env         # Fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy     # Runs migration on your PostgreSQL
node server.js
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env.local   # Set VITE_API_URL=http://localhost:3001
npm install
npm run dev
```

### 3. Migrate existing SQLite data
```bash
cd backend
# Ensure .env has DATABASE_URL and MIGRATION_EMAIL/PASS set
node migrate-sqlite.js
```

---

## Deployment

### Backend → Render
1. Push code to GitHub
2. New Web Service → connect repo → set root directory to `backend`
3. Build: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start: `node server.js`
5. Add environment variables:
   - `DATABASE_URL` — from Render PostgreSQL or Supabase
   - `JWT_SECRET` — random 64-char string
   - `FRONTEND_URL` — your Vercel URL
   - `NODE_ENV=production`

### Frontend → Vercel
1. New Project → connect repo → set root directory to `frontend`
2. Framework: Vite
3. Add environment variable:
   - `VITE_API_URL` — your Render backend URL (e.g. `https://shira-ot-backend.onrender.com`)

### Database → Render PostgreSQL (free)
1. Render Dashboard → New → PostgreSQL
2. Copy Internal Database URL → paste as `DATABASE_URL` in backend env vars

---

## After Deployment
1. Open your Vercel URL
2. Click **Create account** — register with your email
3. Your OT records dashboard is ready
4. (Optional) Run `node migrate-sqlite.js` on Render to import old SQLite data
