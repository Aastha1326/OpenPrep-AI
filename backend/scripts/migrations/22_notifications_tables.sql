-- Migration to create Notifications and PushSubscriptions tables
CREATE TABLE IF NOT EXISTS "Notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "message" TEXT NOT NULL,
  "type" VARCHAR(50) DEFAULT 'general',
  "isRead" BOOLEAN DEFAULT FALSE,
  "link" VARCHAR(255) NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "PushSubscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "endpoint" TEXT NOT NULL,
  "keys" JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "notification_user_isread_idx" ON "Notifications" ("user", "isRead");
CREATE INDEX IF NOT EXISTS "push_sub_user_idx" ON "PushSubscriptions" ("user");
