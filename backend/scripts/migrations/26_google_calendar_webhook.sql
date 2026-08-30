-- Migration to add Google Calendar webhook channel attributes to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleCalendarWebhookChannelId" VARCHAR(255);
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleCalendarWebhookResourceId" VARCHAR(255);
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "googleCalendarWebhookExpiration" TIMESTAMP WITH TIME ZONE;

-- Index channel ID for fast callback lookup
CREATE INDEX IF NOT EXISTS "users_google_calendar_webhook_channel_id_idx"
ON "Users" ("googleCalendarWebhookChannelId");
