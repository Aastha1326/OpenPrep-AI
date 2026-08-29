-- Migration to add eloRating column to Users table

ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "eloRating" INTEGER NOT NULL DEFAULT 1200;
