import HomePageClient from "./HomePageClient";
import { getEventsFromDb } from "@/lib/data/events";
import { getRecruitmentStatus } from "@/lib/config/recruitmentStatus";

export const revalidate = 60;

export default async function Home() {
  const [dbEvents, isRecruitmentOpen] = await Promise.all([
    getEventsFromDb(),
    getRecruitmentStatus(),
  ]);
  const events = dbEvents
    .filter((e) => e.status === "past")
    .map((e) => ({
      slug: e.slug,
      name: e.title,
      date: e.date,
      type: e.domain || "Event",
      description: e.description,
      venue: e.venue,
    }));
  return (
    <HomePageClient
      initialEvents={events}
      isRecruitmentOpen={isRecruitmentOpen}
    />
  );
}
