-- Migration to create Syllabus and SyllabusTopics tables
CREATE TABLE IF NOT EXISTS "Syllabuses" (  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS "SyllabusTopics" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "syllabusId" UUID NOT NULL REFERENCES "Syllabuses"("id") ON DELETE CASCADE,  "moduleName" VARCHAR(255) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "subtopics" JSONB DEFAULT '[]',
  "weightage" INTEGER DEFAULT 0,
  "coverageStatus" VARCHAR(50) DEFAULT 'Unstudied Gap',
  "linkedNoteId" UUID REFERENCES "Notes"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "syllabi_userid_idx" ON "Syllabuses" ("userId");CREATE INDEX IF NOT EXISTS "syllabustopics_syllabusid_idx" ON "SyllabusTopics" ("syllabusId");
CREATE INDEX IF NOT EXISTS "syllabustopics_coveragestatus_idx" ON "SyllabusTopics" ("coverageStatus");
