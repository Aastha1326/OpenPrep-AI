/**
 * Migration: 002_add_indexes_and_constraints
 * Description: Optimizes query paths on frequently searched relational columns
 */

exports.up = (pgm) => {
  // Safe helper to create index if table exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_email ON "Users" (email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON "Users" (role);
      END IF;

      IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Notes') THEN
        CREATE INDEX IF NOT EXISTS idx_notes_user ON "Notes" ("user");
        CREATE INDEX IF NOT EXISTS idx_notes_subject ON "Notes" (subject);
      END IF;

      IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Flashcards') THEN
        CREATE INDEX IF NOT EXISTS idx_flashcards_user ON "Flashcards" ("userId");
        CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON "Flashcards" ("nextReviewDate");
      END IF;
    END $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_email;
    DROP INDEX IF EXISTS idx_users_role;
    DROP INDEX IF EXISTS idx_notes_user;
    DROP INDEX IF EXISTS idx_notes_subject;
    DROP INDEX IF EXISTS idx_flashcards_user;
    DROP INDEX IF EXISTS idx_flashcards_next_review;
  `);
};
