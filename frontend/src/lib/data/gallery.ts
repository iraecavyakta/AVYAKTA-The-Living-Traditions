import "server-only";

import { createPublicClient } from "@/utils/supabase/server";

export type GalleryImage = {
  id: string;
  url: string;
  name: string;
};

export type GalleryEvent = {
  id: string;
  name: string;
  year: string;
  thumbnail: string;
  images: GalleryImage[];
};

type GalleryRow = {
  id: string;
  title: string;
  date: string | null;
  image_url: string | null;
  slug_image_url: string | null;
  poster_image_url: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function splitUrls(input: string | null | undefined): string[] {
  if (!input) return [];
  // Only split on newline/pipe, not comma - a data: URI's own
  // "data:image/...;base64," prefix contains a comma, so splitting on it
  // used to cut every base64-encoded image in half (the prefix kept, the
  // actual image data discarded), leaving nothing renderable.
  return input
    .split(/[\n|]/)
    .map((item) => item.trim())
    .filter(
      (item) => /^https?:\/\//i.test(item) || /^data:image\//i.test(item),
    );
}

// Keep the original seeded gallery previews for events with no uploaded
// photos. These are deterministic Picsum placeholders, not stored event photos.
function fallbackEventImages(title: string, count = 8): string[] {
  const slug = slugify(title) || "avyakta-event";
  return Array.from({ length: count }, (_, index) => {
    const height = index % 3 === 0 ? 1200 : index % 2 === 0 ? 980 : 1100;
    return `https://picsum.photos/seed/${slug}-${index + 1}/900/${height}`;
  });
}

function yearFromDate(dateValue: string | null): string {
  if (!dateValue) {
    return "TBA";
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "TBA";
  }

  return String(parsed.getFullYear());
}

function mapRowsToGalleryEvents(rows: GalleryRow[]): GalleryEvent[] {
  const grouped = new Map<
    string,
    {
      title: string;
      date: string | null;
      images: Set<string>;
    }
  >();

  for (const row of rows) {
    const current = grouped.get(row.id) ?? {
      title: row.title,
      date: row.date,
      images: new Set<string>(),
    };

    const urls = [
      ...splitUrls(row.poster_image_url),
      ...splitUrls(row.slug_image_url),
      ...splitUrls(row.image_url),
    ];

    for (const url of urls) {
      current.images.add(url);
    }

    grouped.set(row.id, current);
  }

  return Array.from(grouped.entries()).map(([id, value]) => {
    const imageUrls = value.images.size
      ? Array.from(value.images)
      : fallbackEventImages(value.title);

    const images = imageUrls.map((url, index) => ({
      id: `${id}-${index + 1}`,
      url,
      name: `${value.title} • Frame ${String(index + 1).padStart(2, "0")}`,
    }));

    return {
      id,
      name: value.title,
      year: yearFromDate(value.date),
      thumbnail: imageUrls[0],
      images,
    };
  });
}

export async function getGalleryEventsFromDb(): Promise<GalleryEvent[]> {
  try {
    const supabase = createPublicClient();
    const { data: rows, error } = await supabase
      .from("events")
      .select(
        `
        id, title, date, image_url,
        event_slug ( image_url ),
        posters ( poster_image_url )
      `,
      )
      .order("date", { ascending: true })
      .order("title", { ascending: true });

    if (error) throw error;

    if (!rows || !rows.length) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedRows = rows.map((row: any) => {
      const slugRows = Array.isArray(row.event_slug)
        ? row.event_slug
        : row.event_slug
          ? [row.event_slug]
          : [];
      const posterRows = Array.isArray(row.posters)
        ? row.posters
        : row.posters
          ? [row.posters]
          : [];

      return {
        id: row.id,
        title: row.title,
        date: row.date,
        image_url: row.image_url,
        slug_image_url: slugRows
          .map((slug: { image_url?: string | null }) => slug?.image_url)
          .filter((url: string | null | undefined): url is string =>
            Boolean(url),
          )
          .join("\n"),
        poster_image_url: posterRows
          .map(
            (poster: { poster_image_url?: string | null }) =>
              poster?.poster_image_url,
          )
          .filter((url: string | null | undefined): url is string =>
            Boolean(url),
          )
          .join("\n"),
      };
    });

    return mapRowsToGalleryEvents(mappedRows);
  } catch (error) {
    console.warn(
      "[gallery] Database unavailable; gallery records could not be loaded.",
      error,
    );
    return [];
  }
}
