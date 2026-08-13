-- Step 1: Create or rename the main table into a partitioned table (or handle existing table migration)
-- For a fresh partitioned setup:
BEGIN;

CREATE TABLE IF NOT EXISTS "QuizAttempts" (
    id SERIAL,
    "userId" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    score INTEGER,
    answers JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id, "createdAt")
) PARTITION BY RANGE ("createdAt");

-- Step 2: Create current and upcoming monthly partitions (e.g., August & September 2026)
CREATE TABLE IF NOT EXISTS "quiz_attempts_2026_08" PARTITION OF "QuizAttempts"
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "quiz_attempts_2026_09" PARTITION OF "QuizAttempts"
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "quiz_attempts_2026_10" PARTITION OF "QuizAttempts"
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

COMMIT;
