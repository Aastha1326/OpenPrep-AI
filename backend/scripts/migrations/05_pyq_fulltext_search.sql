-- Migration script to add PostgreSQL Full-Text Search (tsvector/tsquery) and GIN index to "PYQs" table.
-- Idempotent: safe to run on existing databases.

-- 1. Add search_vector column if it doesn't already exist
ALTER TABLE "PYQs" ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- 2. Populate search_vector with title, chapters, and analysisResults text
UPDATE "PYQs"
SET search_vector = to_tsvector(
  'english',
  coalesce(title, '') || ' ' ||
  coalesce(array_to_string(chapters, ' '), '') || ' ' ||
  coalesce("analysisResults"::text, '')
)
WHERE search_vector IS NULL;

-- 3. Create GIN index on search_vector for fast sub-100ms keyword searches
CREATE INDEX IF NOT EXISTS pyq_search_vector_idx ON "PYQs" USING GIN (search_vector);

-- 4. Create trigger function to automatically update search_vector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION pyq_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(array_to_string(NEW.chapters, ' '), '') || ' ' ||
    coalesce(NEW."analysisResults"::text, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger to "PYQs" table
DROP TRIGGER IF EXISTS pyq_search_vector_trigger ON "PYQs";
CREATE TRIGGER pyq_search_vector_trigger
BEFORE INSERT OR UPDATE ON "PYQs"
FOR EACH ROW EXECUTE FUNCTION pyq_search_vector_update();
