-- Migration to add OAuth 2.0 social authentication columns to Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255) UNIQUE;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "githubId" VARCHAR(255) UNIQUE;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "authProvider" VARCHAR(50) DEFAULT 'local';

-- Make password column nullable
ALTER TABLE "Users" ALTER COLUMN "password" DROP NOT NULL;
