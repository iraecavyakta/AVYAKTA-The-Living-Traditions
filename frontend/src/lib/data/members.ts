import "server-only";

import { createPublicClient } from "@/utils/supabase/server";
import {
  type MemberCard,
  type MemberSectionKey,
} from "@/lib/data/memberSections";

function avatarFromName(name: string) {
  const safe = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${safe}&background=1C1C1C&color=C9A84C&size=400&bold=true`;
}

function sectionFromRole(role: string): MemberSectionKey {
  const normalized = role.toLowerCase();

  if (normalized.includes("founder")) {
    return "founders";
  }

  if (normalized.includes("faculty") || normalized.includes("advisor")) {
    return "faculty-advisors";
  }

  if (normalized.includes("head") || normalized.includes("president")) {
    return "previous-heads";
  }

  if (
    normalized.includes("alumni") ||
    normalized.includes("former") ||
    normalized.includes("previous")
  ) {
    return "previous-members";
  }

  return "current-core-team";
}

function normalizeSection(
  value: string | null | undefined,
): MemberSectionKey | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z-]/g, "");

  if (normalized === "founders" || normalized === "founder") {
    return "founders";
  }

  if (
    normalized === "faculty-advisors" ||
    normalized === "faculty-advisor" ||
    normalized === "advisors"
  ) {
    return "faculty-advisors";
  }

  if (normalized === "previous-heads" || normalized === "previous-head") {
    return "previous-heads";
  }

  if (
    normalized === "previous-members" ||
    normalized === "previous-member" ||
    normalized === "alumni"
  ) {
    return "previous-members";
  }

  if (
    normalized === "current-core-team" ||
    normalized === "current-core" ||
    normalized === "core-team" ||
    normalized === "core"
  ) {
    return "current-core-team";
  }

  return null;
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
  return [
    {
      id: "fallback-1",
      name: "A. Prakash",
      designation: "Founder",
      section: "founders",
      photoUrl: avatarFromName("A Prakash"),
      bio: "Helped shape the earliest culture and creative direction of Avyakta.",
    },
    {
      id: "fallback-2",
      name: "Dr. M. Rao",
      designation: "Faculty Advisor",
      section: "faculty-advisors",
      photoUrl: avatarFromName("Dr M Rao"),
      bio: "Guides team planning, institutional alignment, and annual execution rhythm.",
    },
    {
      id: "fallback-3",
      name: "N. Sagar",
      designation: "Club Head (2024)",
      section: "previous-heads",
      photoUrl: avatarFromName("N Sagar"),
      bio: "Led inter-domain event strategy and member-led production frameworks.",
    },
    {
      id: "fallback-4",
      name: "R. Karthik",
      designation: "Former Member",
      section: "previous-members",
      photoUrl: avatarFromName("R Karthik"),
      bio: "Contributed to flagship event logistics and backstage creative operations.",
    },
    {
      id: "fallback-5",
      name: "P. Sneha",
      designation: "Creative Core Team",
      section: "current-core-team",
      photoUrl: avatarFromName("P Sneha"),
      bio: "Currently working across production design, rehearsals, and member onboarding.",
    },
  ];
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
          String(raw.designation ?? "").trim() || role || "Member";

        const explicitSection = normalizeSection(
          String(raw.section ?? "").trim(),
        );
        const section = explicitSection ?? sectionFromRole(designation);

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
          designation,
          section,
          photoUrl,
          bio,
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
