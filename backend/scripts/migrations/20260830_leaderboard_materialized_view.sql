-- Create materialized view aggregating user metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_analytics AS
SELECT
  u.id AS "userId",
  u.username,
  COALESCE(u.xp, 0) AS "weeklyXp",
  COALESCE(
    (SELECT AVG(qa.score / NULLIF(qa."totalQuestions", 0)) * 100 
     FROM "QuizAttempts" qa 
     WHERE qa.user = u.id), 
    0
  ) AS "accuracyRate",
  COALESCE(
    (SELECT COUNT(*) 
     FROM "ActivityLogs" al 
     WHERE al.user = u.id AND al."createdAt" >= NOW() - INTERVAL '7 days'), 
    0
  ) AS "activeStreak"
FROM "Users" u;

-- Create unique index required for CONCURRENT refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_analytics_user ON leaderboard_analytics ("userId");

-- Create concurrent refresh trigger function
CREATE OR REPLACE FUNCTION refresh_leaderboard_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform non-blocking concurrent refresh
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_analytics;
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback in case unique index is not loaded or DB is cold starting
    REFRESH MATERIALIZED VIEW leaderboard_analytics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Users mutations
DROP TRIGGER IF EXISTS trg_refresh_leaderboard_users ON "Users";
CREATE TRIGGER trg_refresh_leaderboard_users
AFTER INSERT OR UPDATE OR DELETE ON "Users"
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard_analytics();

-- Trigger for QuizAttempts mutations
DROP TRIGGER IF EXISTS trg_refresh_leaderboard_quiz ON "QuizAttempts";
CREATE TRIGGER trg_refresh_leaderboard_quiz
AFTER INSERT OR UPDATE OR DELETE ON "QuizAttempts"
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard_analytics();
