-- 1. Flashcards isArchived and userId columns & index
ALTER TABLE "Flashcards" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN DEFAULT false;
ALTER TABLE "Flashcards" ADD COLUMN IF NOT EXISTS "userId" UUID;
UPDATE "Flashcards" SET "userId" = "user" WHERE "userId" IS NULL;
CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON "Flashcards" ("userId", "nextReviewDate") WHERE "isArchived" = false;

-- 2. QuizAttempts userId and examId columns & index
ALTER TABLE "QuizAttempts" ADD COLUMN IF NOT EXISTS "userId" UUID;
UPDATE "QuizAttempts" SET "userId" = "user" WHERE "userId" IS NULL;
ALTER TABLE "QuizAttempts" ADD COLUMN IF NOT EXISTS "examId" UUID;
UPDATE "QuizAttempts" SET "examId" = "quiz" WHERE "examId" IS NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_exam ON "QuizAttempts" ("userId", "examId", "createdAt" DESC);

-- 3. Progress userId and subjectId columns & index
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "userId" UUID;
UPDATE "Progress" SET "userId" = "user" WHERE "userId" IS NULL;
ALTER TABLE "Progress" ADD COLUMN IF NOT EXISTS "subjectId" UUID;
UPDATE "Progress" SET "subjectId" = "subject" WHERE "subjectId" IS NULL;
CREATE INDEX IF NOT EXISTS idx_progress_user_subject ON "Progress" ("userId", "subjectId");

-- 4. ActivityLogs userId column & index
ALTER TABLE "ActivityLogs" ADD COLUMN IF NOT EXISTS "userId" UUID;
UPDATE "ActivityLogs" SET "userId" = "user" WHERE "userId" IS NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON "ActivityLogs" ("userId", "createdAt" DESC);
