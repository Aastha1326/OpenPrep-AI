-- Migration to add Google Calendar Sync columns to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleCalendarRefreshToken" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "syncGoogleCalendar" BOOLEAN DEFAULT FALSE;
