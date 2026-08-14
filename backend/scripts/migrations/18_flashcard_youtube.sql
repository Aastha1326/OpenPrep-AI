-- Add sourceUrl and timestampSeconds columns to Flashcards table
ALTER TABLE "Flashcards" ADD COLUMN IF NOT EXISTS "sourceUrl" VARCHAR(255);
ALTER TABLE "Flashcards" ADD COLUMN IF NOT EXISTS "timestampSeconds" INTEGER;
