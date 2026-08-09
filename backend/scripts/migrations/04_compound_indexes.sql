-- Migration script to add compound database indexes to optimize high-frequency query paths.
-- Idempotent: safe to run on existing databases.

-- 1. Composite indexes on Progresses
CREATE INDEX IF NOT EXISTS progress_user_subject_idx ON "Progresses" (user, subject);
CREATE INDEX IF NOT EXISTS progress_user_updated_idx ON "Progresses" (user, "updatedAt");

-- 2. Composite indexes on PYQs
CREATE INDEX IF NOT EXISTS pyq_exam_year_subject_idx ON "PYQs" (exam, year, subject);
CREATE INDEX IF NOT EXISTS pyq_user_exam_created_idx ON "PYQs" (user, exam, "createdAt");
CREATE INDEX IF NOT EXISTS pyq_user_subject_year_idx ON "PYQs" (user, subject, year);

-- 3. Composite index on QuizAttempts
CREATE INDEX IF NOT EXISTS quizattempt_user_created_idx ON "QuizAttempts" (user, "createdAt");

-- 4. Composite index on StudyPlans
CREATE INDEX IF NOT EXISTS studyplan_user_exam_created_idx ON "StudyPlans" (user, exam, "createdAt");

-- 5. Composite index on Exams
CREATE INDEX IF NOT EXISTS exam_user_created_idx ON "Exams" (user, "createdAt");
