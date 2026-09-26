-- Prior to this migration, Row Level Security was OFF on every table, so the
-- public anon key (embedded in every page load) had full read/write/delete
-- access to everything, including login_credentials.password_hash and every
-- recruitment applicant's PII. All server-side code already goes through the
-- service_role key (getSupabaseAdmin()), which bypasses RLS by design, so
-- none of that code needs any policy to keep working.

-- Tables that must never be reachable via the anon key: fully locked down,
-- no policies at all (default-deny for anon/authenticated roles).
ALTER TABLE login_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE second_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator ENABLE ROW LEVEL SECURITY;
ALTER TABLE counter ENABLE ROW LEVEL SECURITY;

-- Public-facing tables: the public site reads these directly with the anon
-- key (src/lib/data/events.ts, members.ts, gallery.ts via
-- src/utils/supabase/server.ts), so they keep an explicit public SELECT
-- policy. Writes are still admin-only — only service_role can INSERT/
-- UPDATE/DELETE, since there is no write policy for anon/authenticated.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_slug ENABLE ROW LEVEL SECURITY;
ALTER TABLE posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON events FOR SELECT USING (true);
CREATE POLICY "public read" ON event_slug FOR SELECT USING (true);
CREATE POLICY "public read" ON posters FOR SELECT USING (true);
CREATE POLICY "public read" ON members FOR SELECT USING (true);
