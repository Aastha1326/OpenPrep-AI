-- Migration to add dailyAiUsageCount and lastAiUsageReset fields to Users
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "dailyAiUsageCount" INTEGER DEFAULT 0;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lastAiUsageReset" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
