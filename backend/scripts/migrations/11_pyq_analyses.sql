-- Migration to create PYQAnalyses and PYQQuestions tables
CREATE TABLE IF NOT EXISTS "PYQAnalyses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "examName" VARCHAR(255) NOT NULL,
  "yearRange" VARCHAR(50) NOT NULL,
  "weightageData" JSONB DEFAULT '{}',
  "totalQuestions" INTEGER DEFAULT 0,
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "PYQQuestions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pyqAnalysisId" UUID NOT NULL REFERENCES "PYQAnalyses"("id") ON DELETE CASCADE,
  "chapterName" VARCHAR(255) NOT NULL,
  "topicName" VARCHAR(255) NOT NULL,
  "questionText" TEXT NOT NULL,
  "marks" INTEGER DEFAULT 1,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "pyqanalyses_subjectid_idx" ON "PYQAnalyses" ("subjectId");
CREATE INDEX IF NOT EXISTS "pyqanalyses_userid_idx" ON "PYQAnalyses" ("userId");
CREATE INDEX IF NOT EXISTS "pyqquestions_pyqanalysisid_idx" ON "PYQQuestions" ("pyqAnalysisId");
CREATE INDEX IF NOT EXISTS "pyqquestions_chaptername_idx" ON "PYQQuestions" ("chapterName");
