-- Add roomName and password to BattleSessions table
ALTER TABLE "BattleSessions" ADD COLUMN IF NOT EXISTS "roomName" VARCHAR(255) DEFAULT 'Battle Room';
ALTER TABLE "BattleSessions" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255) DEFAULT '';
