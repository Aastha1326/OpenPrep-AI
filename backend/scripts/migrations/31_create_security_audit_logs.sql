-- Migration to create SecurityAuditLogs table

CREATE TABLE IF NOT EXISTS "SecurityAuditLogs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID REFERENCES "Users"("id") ON DELETE SET NULL,
  "eventType" VARCHAR(100) NOT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'INFO',
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "payloadHash" VARCHAR(64),
  "statusCode" INTEGER,
  "metadata" JSONB,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "securityauditlogs_userid_idx" ON "SecurityAuditLogs" ("userId");
CREATE INDEX IF NOT EXISTS "securityauditlogs_eventtype_idx" ON "SecurityAuditLogs" ("eventType");
CREATE INDEX IF NOT EXISTS "securityauditlogs_timestamp_idx" ON "SecurityAuditLogs" ("timestamp");
CREATE INDEX IF NOT EXISTS "securityauditlogs_severity_idx" ON "SecurityAuditLogs" ("severity");
