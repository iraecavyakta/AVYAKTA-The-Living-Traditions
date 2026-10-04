import "server-only";

import { createPublicClient } from "@/utils/supabase/server";
import { type MemberCard } from "@/lib/data/memberSections";

function avatarFromName(name: string) {
  const safe = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${safe}&background=1C1C1C&color=C9A84C&size=400&bold=true`;
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
        const designation =
          String(raw.designation ?? "").trim() ||
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

        const photoUrl =
          normalizeImageUrl(String(raw.photo_url ?? "").trim()) ??
          normalizeImageUrl(String(raw.photoUrl ?? "").trim()) ??
          avatarFromName(name);

        const explicitBio =
          String(raw.bio ?? "").trim() ||
          String(raw.description ?? "").trim() ||
          String(raw.about ?? "").trim() ||
          String(raw.quote ?? "").trim();

        const domain = String(raw.domain ?? "").trim();
        const bio =
          explicitBio ||
          `${name} contributes to ${domain || "Avyakta"} as ${designation}.`;

        return {
          id,
          name,
          domain,
          designation,
          section,
          photoUrl,
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
