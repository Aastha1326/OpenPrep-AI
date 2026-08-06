-- Add push notification fields to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "pushSubscription" JSONB;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "dailyReminderTime" VARCHAR(255) DEFAULT '09:00';
