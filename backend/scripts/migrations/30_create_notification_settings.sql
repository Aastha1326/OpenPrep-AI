-- Migration to create NotificationSettings table

CREATE TABLE IF NOT EXISTS "NotificationSettings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "Users"("id") ON DELETE CASCADE,
  "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "dailyDigestTime" TIME NOT NULL DEFAULT '07:00:00',
  "streakFreezeWarningEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "overdueFlashcardAlertsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "channelEmailEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "channelTelegramEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "channelInAppEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "telegramChatId" VARCHAR(255),
  "whatsappNumber" VARCHAR(20),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "notificationsettings_userid_idx" ON "NotificationSettings" ("userId");
