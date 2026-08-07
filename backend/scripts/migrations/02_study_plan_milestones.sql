-- Migration script to add the milestones JSONB column to the StudyPlans table
-- for the automated exam milestone schedule generator (issue #623).
-- Idempotent: safe to run on databases that already have the column.

ALTER TABLE "StudyPlans" ADD COLUMN IF NOT EXISTS milestones JSONB NOT NULL DEFAULT '[]'::jsonb;
