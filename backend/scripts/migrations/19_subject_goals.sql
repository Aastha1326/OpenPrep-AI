-- Migration to create per-user subject target score goals
CREATE TABLE IF NOT EXISTS "SubjectGoals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subject" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "targetPercentage" DOUBLE PRECISION NOT NULL CHECK ("targetPercentage" >= 0 AND "targetPercentage" <= 100),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "subject_goals_user_subject_unique" UNIQUE ("user", "subject")
);

CREATE INDEX IF NOT EXISTS "subjectgoal_user_idx" ON "SubjectGoals" ("user");
CREATE INDEX IF NOT EXISTS "subjectgoal_subject_idx" ON "SubjectGoals" ("subject");