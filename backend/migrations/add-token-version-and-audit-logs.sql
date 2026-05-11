-- Migration: add tokenVersion to users + create audit_logs table
-- Required for the auth-hardening / audit-log changes
-- Run once against the production Postgres database

-- 1. Add tokenVersion to users (default 0 so existing rows are valid)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(64) NOT NULL,
  resource VARCHAR(64) NOT NULL,
  "resourceId" VARCHAR(128),
  "actorId" UUID,
  "actorEmail" VARCHAR(320),
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs("actorId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs("createdAt" DESC);
