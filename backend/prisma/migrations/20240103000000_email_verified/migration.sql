-- Add emailVerified flag to User (existing rows get true so no one is locked out)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT true;

-- New unverified users will be inserted with emailVerified = false
-- Existing users (email + google) keep true so they're not affected
