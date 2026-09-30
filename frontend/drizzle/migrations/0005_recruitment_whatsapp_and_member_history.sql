-- Optional group invite URL managed from recruitment settings.
ALTER TABLE recruitment_config
  ADD COLUMN IF NOT EXISTS whatsapp_url text DEFAULT NULL;

-- Public member history supports overlapping roles and year-based alumni.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS year integer;
