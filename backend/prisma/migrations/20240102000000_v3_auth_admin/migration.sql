-- Add new columns to User (all nullable/defaulted so existing rows are safe)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone"        TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName"  TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role"         TEXT NOT NULL DEFAULT 'user';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive"     BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make password nullable for OAuth users
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Add updatedAt to OtSession
ALTER TABLE "OtSession" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Unique index on googleId
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE INDEX        IF NOT EXISTS "User_role_idx"     ON "User"("role");
CREATE INDEX        IF NOT EXISTS "OtSession_userId_status_idx" ON "OtSession"("userId", "status");

-- OtpToken table
CREATE TABLE IF NOT EXISTS "OtpToken" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "purpose"   TEXT NOT NULL DEFAULT 'login',
  "attempts"  INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OtpToken_userId_idx" ON "OtpToken"("userId");

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"        SERIAL PRIMARY KEY,
  "actorId"   INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "targetId"  INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "event"     TEXT NOT NULL,
  "ip"        TEXT,
  "meta"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx"   ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_event_idx"     ON "AuditLog"("event");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Seed admin role for the authorized account (safe upsert)
UPDATE "User" SET "role" = 'admin' WHERE "email" = 'connect.shiraai@gmail.com';
