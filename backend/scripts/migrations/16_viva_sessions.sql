-- Migration to create VivaSessions table
CREATE TABLE IF NOT EXISTS "VivaSessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "turns" JSONB DEFAULT '[]',
  "score" INTEGER DEFAULT 0,
  "feedback" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "vivasessions_userid_idx" ON "VivaSessions" ("userId");
CREATE INDEX IF NOT EXISTS "vivasessions_subjectid_idx" ON "VivaSessions" ("subjectId");
