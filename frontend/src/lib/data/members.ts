import "server-only";

import { createPublicClient } from "@/utils/supabase/server";
import { type MemberCard } from "@/lib/data/memberSections";

function avatarFromName(name: string) {
  const safe = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${safe}&background=1C1C1C&color=C9A84C&size=400&bold=true`;
}

/** "tech" or "tech_team" becomes "Tech Head"; "Design Head" stays as it is. */
function domainHeadTitle(domain: string) {
  const minor = new Set(["and", "of", "the", "for", "in"]);
  const words = domain
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word, index) => {
      // Already an acronym such as PR or IT: leave it alone.
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      const lower = word.toLowerCase();
      if (index > 0 && minor.has(lower)) return lower;
      return lower[0].toUpperCase() + lower.slice(1);
    })
    .join(" ");
  return /head$/i.test(words) ? words : `${words} Head`;
}

function tagsFromRow(raw: Record<string, unknown>, role: string): string[] {
  const explicit = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : [];
  if (explicit.length) return Array.from(new Set(explicit));

  const oldSection = String(raw.section ?? "")
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (oldSection.includes("faculty")) return ["faculty"];
  if (oldSection.includes("founder")) return ["founder", "previous"];
  if (oldSection.includes("previous-head")) return ["previous", "head"];
  if (oldSection.includes("previous-member")) return ["previous"];
  if (oldSection.includes("current")) return ["current"];

  const normalized = role.toLowerCase();
  if (normalized.includes("faculty") || normalized.includes("advisor"))
    return ["faculty"];
  if (
    normalized.includes("previous") ||
    normalized.includes("former") ||
    normalized.includes("alumni")
  ) {
    return ["previous", ...(normalized.includes("head") ? ["head"] : [])];
  }
  if (normalized.includes("founder")) return ["founder", "previous"];
  return [
    "current",
    ...(normalized.includes("head") || normalized.includes("president")
      ? ["head"]
      : []),
  ];
}

function sectionFromTags(tags: string[]): MemberCard["section"] {
  if (tags.includes("faculty")) return "faculty";
  if (tags.includes("current")) return "current-team";
  return "past-teams";
}

function normalizeImageUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function fallbackMembers(): MemberCard[] {
  return [];
}

export async function getMembersFromDb(): Promise<MemberCard[]> {
  try {
    const supabase = createPublicClient();
    const { data: rows, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    if (!rows || !rows.length) {
      return fallbackMembers();
    }

    const mapped = rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((raw: any) => {
        const id = String(raw.id ?? "").trim();
        const name = String(raw.name ?? "").trim();

        if (!id || !name) {
          return null;
        }

        const role = String(raw.role ?? "").trim();
        const domain = String(raw.domain ?? "").trim();
        const storedDesignation = String(raw.designation ?? "").trim();

        // A POC heads a department, not a club domain: their domain column
        // holds a branch such as MBBS or Nursing, so they are "Dept Head -
        // MBBS" rather than the club role they happen to be stored with.
        const isPoc =
          Array.isArray(raw.tags) &&
          raw.tags.some(
            (tag: unknown) => String(tag).trim().toLowerCase() === "poc",
          );

        // A domain head is named by their domain: "Tech Head", not the
        // generic "Domain Head". A stored designation wins, except when it
        // is itself the generic label we are trying to replace.
        const designation =
          isPoc && domain
            ? `Dept Head - ${domain}`
            : role === "domain_head" &&
                domain &&
                (!storedDesignation ||
                  /^domain[\s_-]*head$/i.test(storedDesignation))
              ? domainHeadTitle(domain)
              : storedDesignation ||
                (role === "club_head"
                  ? "Club Head"
                  : role === "domain_head"
                    ? "Domain Head"
                    : role === "members"
                      ? "Member"
                      : role || "Member");

        const tags = tagsFromRow(
          raw as Record<string, unknown>,
          role || designation,
        );
        const section = sectionFromTags(tags);
        const yearValue = Number(raw.year);
        const year =
          Number.isInteger(yearValue) && yearValue >= 2000 && yearValue <= 2100
            ? yearValue
            : null;

        const realPhoto =
          normalizeImageUrl(String(raw.photo_url ?? "").trim()) ??
          normalizeImageUrl(String(raw.photoUrl ?? "").trim());
        const photoUrl = realPhoto ?? avatarFromName(name);

        // Optional: a background-removed PNG for the cutout card. Any of
        // these column names works, and none existing is fine - the card
        // falls back to the ordinary photo.
        const cutoutUrl =
          normalizeImageUrl(String(raw.cutout_url ?? "").trim()) ??
          normalizeImageUrl(String(raw.cutoutUrl ?? "").trim()) ??
          normalizeImageUrl(String(raw.photo_cutout_url ?? "").trim());

        const explicitBio =
          String(raw.bio ?? "").trim() ||
          String(raw.description ?? "").trim() ||
          String(raw.about ?? "").trim() ||
          String(raw.quote ?? "").trim();

        const bio =
          explicitBio ||
          (isPoc && domain
            ? // Otherwise this reads "contributes to MBBS as Dept Head - MBBS".
              `${name} is Avyakta's point of contact for the ${domain} department.`
            : `${name} contributes to ${domain || "Avyakta"} as ${designation}.`);

        return {
          id,
          name,
          domain,
          designation,
          role,
          section,
          photoUrl,
          hasPhoto: Boolean(realPhoto),
          cutoutUrl,
          bio,
          tags,
          year,
        } satisfies MemberCard;
      })
      .filter((item): item is MemberCard => Boolean(item));

    return mapped.length ? mapped : fallbackMembers();
  } catch (error) {
    console.warn(
      "[members] Database unavailable, serving fallback members.",
      error,
    );
    return fallbackMembers();
  }
}
