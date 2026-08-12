ALTER TABLE "Users"
ADD COLUMN IF NOT EXISTS "examCountdownPreferences" JSONB NOT NULL DEFAULT '{"targetExamDate":null,"targetScore":null,"milestones":[]}'::jsonb;