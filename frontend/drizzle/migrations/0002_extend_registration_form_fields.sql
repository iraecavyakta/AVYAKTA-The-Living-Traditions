ALTER TABLE registration
  ADD COLUMN IF NOT EXISTS is_volunteer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS class_year integer,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS dietary_needs text,
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS volunteer_domain text,
  ADD COLUMN IF NOT EXISTS volunteer_experience text,
  ADD COLUMN IF NOT EXISTS links text;
