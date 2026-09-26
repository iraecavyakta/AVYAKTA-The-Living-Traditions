import { notFound } from "next/navigation";
import { getEventBySlugFromDb } from "@/lib/data/events";
import EventDetailClient from "./EventDetailClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlugFromDb(slug);

  if (!event) {
    notFound();
  }

  return <EventDetailClient event={event} />;
}
