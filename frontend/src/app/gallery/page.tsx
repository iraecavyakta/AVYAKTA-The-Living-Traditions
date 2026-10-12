import GalleryPageClient from "./GalleryPageClient";
import { getGalleryEventsFromDb } from "@/lib/data/gallery";

export const revalidate = false;

export default async function GalleryPage() {
  const events = await getGalleryEventsFromDb();
  return <GalleryPageClient initialEvents={events} />;
}
