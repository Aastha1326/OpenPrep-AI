-- Migration script to add GIN full-text search index on topic names and flashcard front text.

CREATE INDEX IF NOT EXISTS topics_name_gin_idx ON "Topics" USING GIN (to_tsvector('english', coalesce("name", '')));
CREATE INDEX IF NOT EXISTS flashcards_front_gin_idx ON "Flashcards" USING GIN (to_tsvector('english', coalesce("front", '')));
