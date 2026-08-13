-- Migration script to add indexes to optimize flashcards query paths.
-- Idempotent: safe to run on existing databases.

CREATE INDEX IF NOT EXISTS idx_flashcards_user_next_review ON "Flashcards" ("user", "nextReviewDate");
CREATE INDEX IF NOT EXISTS idx_flashcards_user_topic ON "Flashcards" ("user", "topic");
