-- Migration script to add DeckRatings and update Subjects for community flashcard ratings.
-- Idempotent: safe to run on existing databases.

ALTER TABLE "Subjects" ADD COLUMN IF NOT EXISTS "ratingsCount" INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS "DeckRatings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "deckId" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "stars" INTEGER NOT NULL CHECK ("stars" >= 1 AND "stars" <= 5),
  "comment" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE ("deckId", "userId")
);

CREATE INDEX IF NOT EXISTS deck_rating_deck_idx ON "DeckRatings" ("deckId");
CREATE INDEX IF NOT EXISTS deck_rating_user_idx ON "DeckRatings" ("userId");
