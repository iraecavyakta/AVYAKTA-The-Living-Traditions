export type MemberSectionKey = "current-team" | "past-teams" | "faculty";

export type MemberCard = {
  id: string;
  name: string;
  domain: string;
  designation: string;
  section: MemberSectionKey;
  photoUrl: string;
  bio: string;
  tags: string[];
  year: number | null;
};

export const memberSectionOrder: Array<{ key: MemberSectionKey; title: string }> = [
  { key: "current-team", title: "Current Team" },
  { key: "past-teams", title: "Past Teams" },
  { key: "faculty", title: "Faculty" },
];
