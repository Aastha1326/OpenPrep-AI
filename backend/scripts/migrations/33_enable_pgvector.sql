-- Migration to enable pgvector and add vector embedding fields to Notes and Quizzes tables

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "Notes" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
ALTER TABLE "Quizzes" ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Add vector indexing for fast cosine similarity search (using IVFFlat or HNSW if available)
CREATE INDEX IF NOT EXISTS "notes_embedding_hnsw_idx" ON "Notes" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "quizzes_embedding_hnsw_idx" ON "Quizzes" USING hnsw ("embedding" vector_cosine_ops);
