-- Migration to create PodcastEpisodes table
CREATE TABLE IF NOT EXISTS "PodcastEpisodes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subjects"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "audioUrl" VARCHAR(255) NOT NULL,
  "durationSeconds" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "podcastepisodes_userid_idx" ON "PodcastEpisodes" ("userId");
CREATE INDEX IF NOT EXISTS "podcastepisodes_subjectid_idx" ON "PodcastEpisodes" ("subjectId");
CREATE INDEX IF NOT EXISTS "podcastepisodes_userid_subjectid_idx" ON "PodcastEpisodes" ("userId", "subjectId");
