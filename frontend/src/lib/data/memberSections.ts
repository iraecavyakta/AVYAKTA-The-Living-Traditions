export type MemberSectionKey = "current-team" | "past-teams" | "faculty";

export type MemberCard = {
  id: string;
  name: string;
  domain: string;
  designation: string;
  role: string;
  section: MemberSectionKey;
  photoUrl: string;
  /** False when photoUrl is the generated initials avatar, not a real photo. */
  hasPhoto: boolean;
  /**
   * A background-removed PNG of the person, when one has been uploaded. The
   * card stands them on its panel and lets them break past its top edge.
   * Without one it falls back to photoUrl framed inside the panel, because a
   * rectangular photo pushed past the edge just shows its own corners.
   */
  cutoutUrl: string | null;
  bio: string;
  tags: string[];
  year: number | null;
};

/**
 * Every team page section a person belongs in, from their tags (one person can
 * be in several):
 *  - Faculty: only the Faculty section, plus "The People Who Built Avyakta"
 *    if they are also a Founder. Never the current team.
 *  - Founder: The People Who Built Avyakta (also Current Team if tagged current).
 *  - Previous: The People Who Built Avyakta.
 *  - Current (or Club Head): Current Team.
 */
export function sectionsFor(tags: string[]): MemberSectionKey[] {
  const has = (tag: string) => tags.includes(tag);
  const faculty = has("faculty");
  const sections: MemberSectionKey[] = [];
  if (!faculty && (has("current") || has("club_head")))
    sections.push("current-team");
  if (has("founder") || (!faculty && has("previous")))
    sections.push("past-teams");
  if (faculty) sections.push("faculty");
  return sections;
}

/** Display order inside Current Team: club head, domain heads, POCs, members. */
export function currentTeamRank(member: MemberCard): number {
  if (member.role === "club_head" || member.tags.includes("club_head"))
    return 0;
  if (member.role === "domain_head") return 1;
  if (member.tags.includes("poc")) return 2;
  return 3;
}

export const memberSectionOrder: Array<{
  key: MemberSectionKey;
  title: string;
}> = [
  { key: "current-team", title: "Current Team" },
  { key: "past-teams", title: "Past Teams" },
  { key: "faculty", title: "Faculty" },
];
