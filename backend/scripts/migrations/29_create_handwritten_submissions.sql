-- Migration to create HandwrittenSubmissions table

CREATE TABLE IF NOT EXISTS "HandwrittenSubmissions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "examId" UUID REFERENCES "Exams"("id") ON DELETE SET NULL,
  "photoUrls" TEXT[] NOT NULL DEFAULT '{}',
  "transcription" TEXT,
  "evaluation" JSONB,
  "modelAnswer" TEXT,
  "rubricDescription" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "handwrittensubmissions_userid_idx" ON "HandwrittenSubmissions" ("userId");
