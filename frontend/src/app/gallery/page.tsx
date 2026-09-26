import GalleryPageClient from "./GalleryPageClient";
import { getGalleryEventsFromDb } from "@/lib/data/gallery";

export const revalidate = 60;

export default async function GalleryPage() {
  const events = await getGalleryEventsFromDb();
  return <GalleryPageClient initialEvents={events} />;
}
