-- Enable Row-Level Security (RLS) on Exams, StudyPlans, QuizAttempts and Notes tables

ALTER TABLE "Exams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyPlans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notes" ENABLE ROW LEVEL SECURITY;

-- 1. Exams RLS Policy
DROP POLICY IF EXISTS exam_tenant_isolation_policy ON "Exams";
CREATE POLICY exam_tenant_isolation_policy ON "Exams"
  FOR ALL
  USING (
    ("user"::text = current_setting('app.current_user_id', true))
    OR (current_setting('app.is_admin', true) = 'true')
  );

-- 2. StudyPlans RLS Policy
DROP POLICY IF EXISTS studyplan_tenant_isolation_policy ON "StudyPlans";
CREATE POLICY studyplan_tenant_isolation_policy ON "StudyPlans"
  FOR ALL
  USING (
    ("user"::text = current_setting('app.current_user_id', true))
    OR (current_setting('app.is_admin', true) = 'true')
  );

-- 3. QuizAttempts RLS Policy
DROP POLICY IF EXISTS quizattempt_tenant_isolation_policy ON "QuizAttempts";
CREATE POLICY quizattempt_tenant_isolation_policy ON "QuizAttempts"
  FOR ALL
  USING (
    ("user"::text = current_setting('app.current_user_id', true))
    OR (current_setting('app.is_admin', true) = 'true')
  );

-- 4. Notes RLS Policy
DROP POLICY IF EXISTS note_tenant_isolation_policy ON "Notes";
CREATE POLICY note_tenant_isolation_policy ON "Notes"
  FOR ALL
  USING (
    ("user"::text = current_setting('app.current_user_id', true))
    OR (current_setting('app.is_admin', true) = 'true')
  );
