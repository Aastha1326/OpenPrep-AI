CREATE TABLE IF NOT EXISTS "FlashcardDecks" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "subject" UUID REFERENCES "Subjects"("id") ON DELETE SET NULL,
  "user" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "isPublic" BOOLEAN DEFAULT FALSE,
  "shareToken" UUID UNIQUE,
  "cloneCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE "Flashcards" ADD COLUMN IF NOT EXISTS "deckId" UUID REFERENCES "FlashcardDecks"("id") ON DELETE SET NULL;

INSERT INTO "FlashcardDecks" ("id", "name", "subject", "user", "isPublic", "cloneCount", "createdAt", "updatedAt")
SELECT
  gen_random_uuid() as "id",
  COALESCE(s.name, 'My Flashcard Deck') as "name",
  f.subject as "subject",
  f.user as "user",
  FALSE as "isPublic",
  0 as "cloneCount",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM (SELECT DISTINCT "user", "subject" FROM "Flashcards" WHERE "deckId" IS NULL) f
LEFT JOIN "Subjects" s ON s.id = f.subject;

UPDATE "Flashcards" f
SET "deckId" = d.id
FROM "FlashcardDecks" d
WHERE f."user" = d."user" AND f."subject" = d."subject" AND f."deckId" IS NULL;
