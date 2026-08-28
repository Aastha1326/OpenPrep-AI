-- Migration to create MockInterviewSessions table

CREATE TABLE IF NOT EXISTS "MockInterviewSessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "roomId" VARCHAR(255) NOT NULL,
  "transcription" TEXT DEFAULT '',
  "metrics" JSONB DEFAULT '{}',
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "mockinterviewsessions_userid_idx" ON "MockInterviewSessions" ("userId");
CREATE INDEX IF NOT EXISTS "mockinterviewsessions_roomid_idx" ON "MockInterviewSessions" ("roomId");
