import HomePageClient from "./HomePageClient";
import { getEventsFromDb } from "@/lib/data/events";
import { getGalleryEventsFromDb } from "@/lib/data/gallery";
import { getRecruitmentStatus } from "@/lib/config/recruitmentStatus";

export const revalidate = 60;

function toCardSummary(summary: string) {
  const normalized = summary.replace(/\s+/g, " ").trim();
  if (normalized.length <= 170) return normalized;
  const clipped = normalized.slice(0, 167);
  const lastWordBoundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastWordBoundary > 120 ? lastWordBoundary : 167)}…`;
}

export default async function Home() {
  const [dbEvents, galleryEvents, isRecruitmentOpen] = await Promise.all([
    getEventsFromDb(),
    getGalleryEventsFromDb(),
    getRecruitmentStatus(),
  ]);
  const events = dbEvents
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      name: e.title,
      date: e.date,
      description: toCardSummary(e.subtitle),
      venue: e.venue,
      highlights: e.highlights,
    }));
  return (
    <HomePageClient
      initialEvents={events}
      galleryEvents={galleryEvents.map((event) => ({
        id: event.id,
        name: event.name,
        year: event.year,
        coverUrl: event.images[0]?.url ?? null,
        imageCount: event.images.length,
      }))}
      isRecruitmentOpen={isRecruitmentOpen}
    />
  );
}
