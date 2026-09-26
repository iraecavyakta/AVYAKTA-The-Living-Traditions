-- Replaces the filesystem-based recruitment on/off flag
-- (src/config/recruitment-status.json). A local file doesn't survive on
-- serverless deployments (read-only/ephemeral FS, and each instance has its
-- own copy), which is why toggling it didn't reliably take effect. Single
-- source of truth in the DB instead, same pattern as `indicator`/`counter`.
CREATE TABLE IF NOT EXISTS recruitment_config (
  id boolean PRIMARY KEY DEFAULT true,
  is_open boolean NOT NULL DEFAULT true,
  CONSTRAINT recruitment_config_singleton CHECK (id = true)
);

INSERT INTO recruitment_config (id, is_open)
VALUES (true, true)
ON CONFLICT (id) DO NOTHING;

-- No public policy: only ever read/written server-side via the service_role
-- key (getSupabaseAdmin()), same as indicator/counter.
ALTER TABLE recruitment_config ENABLE ROW LEVEL SECURITY;
