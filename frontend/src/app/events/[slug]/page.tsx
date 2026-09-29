import { notFound } from "next/navigation";
import { getEventBySlugFromDb } from "@/lib/data/events";
import { getGalleryEventsFromDb } from "@/lib/data/gallery";
import { getMembersFromDb } from "@/lib/data/members";
import EventDetailClient from "./EventDetailClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const [event, galleryEvents, members] = await Promise.all([
    getEventBySlugFromDb(slug),
    getGalleryEventsFromDb(),
    getMembersFromDb(),
  ]);

  if (!event) {
    notFound();
  }

  const galleryImages =
    galleryEvents
      .find((galleryEvent) => galleryEvent.id === event.id)
      ?.images.filter(
        (image) => !image.url.startsWith("https://picsum.photos/"),
      )
      .slice(0, 4) ?? [];
  const eventManagers = members
    .filter(
      (member) =>
        member.tags.includes("current") &&
        (member.tags.includes("head") ||
          member.designation.toLowerCase().includes("head")) &&
        ["Event Management", "Operations"].includes(member.domain),
    )
    .map((member) => ({
      id: member.id,
      name: member.name,
      domain: member.domain,
      designation: member.designation,
    }));

  return (
    <EventDetailClient
      event={event}
      galleryImages={galleryImages}
      eventManagers={eventManagers}
    />
  );
}
