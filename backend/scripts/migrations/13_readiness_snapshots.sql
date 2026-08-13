-- Migration to create ReadinessSnapshots table
CREATE TABLE IF NOT EXISTS "ReadinessSnapshots" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "readinessScore" INTEGER DEFAULT 0,
  "syllabusCoverage" INTEGER DEFAULT 0,
  "quizAccuracy" INTEGER DEFAULT 0,
  "memoryRetention" INTEGER DEFAULT 0,
  "studyVelocity" INTEGER DEFAULT 0,
  "aiRecommendation" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "readinesssnapshots_userid_idx" ON "ReadinessSnapshots" ("userId");
CREATE INDEX IF NOT EXISTS "readinesssnapshots_subjectid_idx" ON "ReadinessSnapshots" ("subjectId");
CREATE INDEX IF NOT EXISTS "readinesssnapshots_userid_subjectid_idx" ON "ReadinessSnapshots" ("userId", "subjectId");
