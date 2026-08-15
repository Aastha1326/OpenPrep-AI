-- Migration to add collaborative columns to Notes table
ALTER TABLE "Notes" ADD COLUMN IF NOT EXISTS "docState" BYTEA;
ALTER TABLE "Notes" ADD COLUMN IF NOT EXISTS "isCollaborative" BOOLEAN DEFAULT FALSE;
