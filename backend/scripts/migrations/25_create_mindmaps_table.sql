-- Migration to create MindMaps table
CREATE TABLE IF NOT EXISTS "MindMaps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subject" UUID REFERENCES "Subjects"("id") ON DELETE SET NULL,
  "note" UUID REFERENCES "Notes"("id") ON DELETE SET NULL,
  "title" VARCHAR(255) NOT NULL DEFAULT 'Interactive Concept Mind Map',
  "nodesData" JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "hierarchy": {}}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "mindmap_user_idx" ON "MindMaps" ("user");
CREATE INDEX IF NOT EXISTS "mindmap_subject_idx" ON "MindMaps" ("subject");
CREATE INDEX IF NOT EXISTS "mindmap_note_idx" ON "MindMaps" ("note");
