-- Migration script to add database indexes for PYQ and Topic models concurrently.
-- Concurrent index creation requires running in a separate connection pool transaction context or running outside multi-statement transactions.

-- Composite index on PYQ filter parameters (subject, year, difficulty)
CREATE INDEX CONCURRENTLY IF NOT EXISTS pyq_subject_year_difficulty_idx ON "PYQs" (subject, year, difficulty);

-- Composite index on Topic lookup (subject, name)
CREATE INDEX CONCURRENTLY IF NOT EXISTS topic_subject_name_idx ON "Topics" (subject, name);
