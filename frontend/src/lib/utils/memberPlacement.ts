// Club Head is club-level: no domain, no role. A POC needs no explicit role and
// defaults to a regular member. Both columns are NOT NULL in the database, so
// "no domain" is stored as an empty string.
export function resolvePlacement(input: {
  domain?: unknown;
  role?: unknown;
  tags?: unknown;
}): { domain: string; role: string } {
  const tags = Array.isArray(input.tags) ? input.tags : [];

  if (tags.includes("club_head")) return { domain: "", role: "club_head" };

  const role = String(input.role ?? "").trim();
  return {
    domain: String(input.domain ?? "").trim(),
    role: role || (tags.includes("poc") ? "members" : ""),
  };
}
