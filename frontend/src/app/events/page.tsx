import EventsPageClient from "./EventsPageClient";
import { getEventsFromDb } from "@/lib/data/events";

export const revalidate = false;

export default async function EventsPage() {
  const events = await getEventsFromDb();
  return <EventsPageClient initialEvents={events} />;
}
