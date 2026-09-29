import "server-only";

import { createPublicClient } from "@/utils/supabase/server";
import {
  formatEventDate,
  inferEventStatus,
  type EventItem,
  type EventTimelineItem,
} from "@/lib/utils/events";

const posterFallbacks = [
  "linear-gradient(145deg, rgba(201,168,76,0.95), rgba(139,26,26,0.72), rgba(27,94,59,0.8))",
  "linear-gradient(145deg, rgba(146,121,27,0.9), rgba(28,28,28,0.7), rgba(139,26,26,0.78))",
  "linear-gradient(145deg, rgba(27,94,59,0.85), rgba(201,168,76,0.9), rgba(28,28,28,0.82))",
  "linear-gradient(145deg, rgba(139,26,26,0.92), rgba(80,32,24,0.86), rgba(28,28,28,0.8))",
  "linear-gradient(145deg, rgba(120,57,26,0.9), rgba(146,121,27,0.85), rgba(28,28,28,0.8))",
];

type ParsedDetails = {
  description: string;
  domain: string;
  highlights: string[];
  timeline: EventTimelineItem[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function titleHashIndex(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash % posterFallbacks.length;
}

function firstSentence(input: string, fallback: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return fallback;
  }

  const sentence = trimmed.match(/[^.!?]+[.!?]?/u)?.[0]?.trim();
  return sentence && sentence.length > 8 ? sentence : trimmed.slice(0, 120);
}

function parseHighlights(value: string): string[] {
  return value
    .split(/[\n,;|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function parseTimeline(value: string): EventTimelineItem[] {
  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [time, ...labelParts] = entry.split("-");
      const label = labelParts.join("-").trim();
      return {
        time: time?.trim() || "TBA",
        label: label || entry,
      };
    })
    .slice(0, 8);
}

function parseEventDetails(input: {
  description: string;
  moreDescription: string | null;
  domain: string | null;
  highlights: string | null;
  timeline: string | null;
}): ParsedDetails {
  const description = input.moreDescription?.trim() || input.description;

  return {
    description: description || "Details will be announced soon.",
    domain: input.domain?.trim() || "General",
    highlights: input.highlights ? parseHighlights(input.highlights) : [],
    timeline: input.timeline ? parseTimeline(input.timeline) : [],
  };
}

function mapRowToEvent(row: {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  highlights: string | null;
  timeline: string | null;
  date: string | null;
  venue: string | null;
  image_url: string | null;
  more_description: string | null;
  slug_image_url: string | null;
  poster_image_url: string | null;
}): EventItem {
  const baseDescription =
    row.description?.trim() || "Details will be announced soon.";
  const parsed = parseEventDetails({
    description: baseDescription,
    moreDescription: row.more_description,
    domain: row.domain,
    highlights: row.highlights,
    timeline: row.timeline,
  });
  const computedSlug = slugify(row.title);
  const subtitleFallback = `Explore ${row.title} with Avyakta.`;

  const posterUrl = [row.poster_image_url, row.slug_image_url, row.image_url]
    .flatMap((value) => (value || "").split(/[\n|]/))
    .map((value) => value.trim())
    .find((value) => /^https?:\/\//i.test(value) || /^data:image\//i.test(value)) || null;

  return {
    id: row.id,
    slug: computedSlug,
    title: row.title,
    subtitle: firstSentence(baseDescription, subtitleFallback),
    description: parsed.description,
    date: formatEventDate(row.date),
    status: inferEventStatus(row.date),
    domain: parsed.domain,
    posterUrl,
    posterFallback: posterFallbacks[titleHashIndex(row.title)],
    venue: row.venue || undefined,
    highlights: parsed.highlights,
    timeline: parsed.timeline,
  };
}

async function fetchRawEventRows() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id, title, description, domain, highlights, timeline, image_url, date, venue,
        event_slug ( more_description, image_url ),
        posters ( poster_image_url )
      `,
      )
      .order("date", { ascending: true })
      .order("title", { ascending: true });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => {
      const es = Array.isArray(row.event_slug)
        ? row.event_slug[0]
        : row.event_slug;
      const p = Array.isArray(row.posters) ? row.posters[0] : row.posters;

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        domain: row.domain,
        highlights: row.highlights,
        timeline: row.timeline,
        image_url: row.image_url,
        date: row.date,
        venue: row.venue,
        more_description: es?.more_description,
        slug_image_url: es?.image_url,
        poster_image_url: p?.poster_image_url,
      };
    });
  } catch (error) {
    throw error;
  }
}

export async function getEventsFromDb(): Promise<EventItem[]> {
  try {
    const rows = await fetchRawEventRows();
    const deduped = new Map<string, EventItem>();

    for (const row of rows) {
      if (!deduped.has(row.id)) {
        deduped.set(row.id, mapRowToEvent(row));
        continue;
      }

      const existing = deduped.get(row.id)!;
      if (!existing.posterUrl && row.poster_image_url) {
        deduped.set(row.id, { ...existing, posterUrl: row.poster_image_url });
      }
    }

    return Array.from(deduped.values());
  } catch (error) {
    console.warn(
      "[events] Database unavailable, serving empty event list.",
      error,
    );
    return [];
  }
}

export async function getEventBySlugFromDb(
  slug: string,
): Promise<EventItem | null> {
  try {
    const rows = await fetchRawEventRows();

    for (const row of rows) {
      const rowSlug = slugify(row.title);
      if (rowSlug === slug) {
        return mapRowToEvent(row);
      }
    }

    return null;
  } catch (error) {
    console.warn(
      `[events] Database unavailable for slug lookup: ${slug}`,
      error,
    );
    return null;
  }
}
