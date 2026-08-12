-- Migration to create BattleSessions and BattleParticipants tables
CREATE TABLE IF NOT EXISTS "BattleSessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "roomCode" VARCHAR(6) NOT NULL UNIQUE,
  "hostUserId" UUID NOT NULL,
  "subjectId" UUID,
  "topicId" UUID,
  "questionCount" INTEGER DEFAULT 5,
  "timePerQuestion" INTEGER DEFAULT 15,
  "status" VARCHAR(50) DEFAULT 'waiting',
  "scores" JSONB DEFAULT '{}',
  "quizId" UUID,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "BattleParticipants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "battleId" UUID NOT NULL REFERENCES "BattleSessions"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "score" INTEGER DEFAULT 0,
  "correctCount" INTEGER DEFAULT 0,
  "avgTimeMs" DOUBLE PRECISION DEFAULT 0.0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "battlesessions_roomcode_idx" ON "BattleSessions" ("roomCode");
CREATE INDEX IF NOT EXISTS "battleparticipants_battleid_idx" ON "BattleParticipants" ("battleId");
CREATE INDEX IF NOT EXISTS "battleparticipants_userid_idx" ON "BattleParticipants" ("userId");
