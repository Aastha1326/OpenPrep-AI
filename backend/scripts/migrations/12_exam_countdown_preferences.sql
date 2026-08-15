-- Add a uniqueness constraint so each streak milestone
-- can only be unlocked once per user.

CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_user_id_badge_code_unique"
ON "UserBadges" ("userId", "badgeCode");