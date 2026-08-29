-- Migration to create ExamIntegrityReports database table

CREATE TABLE IF NOT EXISTS "ExamIntegrityReports" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "quizAttemptId" UUID NOT NULL REFERENCES "QuizAttempts"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "telemetryLogs" JSONB DEFAULT '[]',
  "biometrics" JSONB DEFAULT '{}',
  "trustScore" INTEGER NOT NULL DEFAULT 100,
  "anomalyFlags" VARCHAR(255)[] DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "examintegrityreports_quizattemptid_idx" ON "ExamIntegrityReports" ("quizAttemptId");
CREATE INDEX IF NOT EXISTS "examintegrityreports_userid_idx" ON "ExamIntegrityReports" ("userId");
