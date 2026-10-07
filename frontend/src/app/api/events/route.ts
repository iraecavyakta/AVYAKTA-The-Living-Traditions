import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { retryWithBackoff } from "../../../lib/api/retry";
import { verifyAdminAuth } from "../../../lib/auth/session";
import { eventWriteSchema } from "../../../lib/validators/event";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type EventWritePayload = {
  title: string;
  description: string | null;
  highlights?: string | null;
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  registration_deadline?: string | null;
  payment_image_required?: boolean;
};

// A half-saved new event (row created, images not) would be duplicated when
// the admin retries, so remove it before reporting the failure.
async function rollbackEvent(eventId: string) {
  await supabase.from("events").delete().eq("id", eventId);
}

// GET - Fetch all events with related data
export async function GET() {
  try {
    const result = await retryWithBackoff(async () =>
      supabase
        .from("events")
        .select(
          `
          *,
          event_slug(*),
          posters(*)
        `,
        )
        .order("date", { ascending: false }),
    );

    const { data: events, error: eventsError } = result;
    if (eventsError) throw new Error(eventsError.message);

    return NextResponse.json({ success: true, data: events || [] });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin authentication required",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = eventWriteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      highlights,
      image_url,
      date,
      venue,
      registration_enabled,
      registration_status,
      registration_deadline,
      payment_image_required,
      more_description,
      slug_image_url,
      poster_image_urls,
    } = validation.data;

    // events.date is NOT NULL in the database; say so instead of failing deep in SQL.
    if (!date) {
      return NextResponse.json(
        { success: false, error: "Please choose the event date." },
        { status: 400 },
      );
    }

    const insertPayload: EventWritePayload = {
      title: title.trim(),
      description: description?.trim() || "", // NOT NULL in the database
      image_url: image_url || null,
      date: date || null,
    };

    // Only add optional fields if they're provided
    if (venue !== undefined) {
      insertPayload.venue = venue?.trim() || null;
    }
    if (highlights !== undefined) {
      insertPayload.highlights = highlights?.trim() || null;
    }
    if (registration_enabled !== undefined) {
      insertPayload.registration_enabled = registration_enabled;
    }
    if (registration_status !== undefined) {
      insertPayload.registration_status = registration_status;
    }
    if (registration_deadline !== undefined) {
      insertPayload.registration_deadline = registration_deadline || null;
    }
    if (payment_image_required !== undefined) {
      insertPayload.payment_image_required = payment_image_required;
    }

    const result = await retryWithBackoff(async () =>
      supabase
        .from("events")
        .insert([insertPayload])
        .select(
          `
          *,
          event_slug(*),
          posters(*)
        `,
        ),
    );

    let { data, error } = result;

    // Backward compatible fallback when optional DB columns are not migrated yet
    if (
      error &&
      (error.message?.includes("registration_enabled") ||
        error.message?.includes("payment_image_required") ||
        error.message?.includes("schema cache"))
    ) {
      const fallbackPayload = {
        title: title.trim(),
        description: description?.trim() || "", // NOT NULL in the database
        image_url: image_url || null,
        date: date || null,
      };

      const retryResult = await retryWithBackoff(async () =>
        supabase
          .from("events")
          .insert([fallbackPayload])
          .select(
            `
            *,
            event_slug(*),
            posters(*)
          `,
          ),
      );

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) throw new Error(error.message);

    // Create slug if provided
    if (data && data.length > 0 && (more_description || slug_image_url)) {
      const eventId = data[0].id;
      // more_description is NOT NULL in the database, so it can't be left out
      // when only images are being added.
      const slugPayload: Record<string, unknown> = {
        event_id: eventId,
        more_description: more_description || "",
      };

      if (slug_image_url) {
        slugPayload.image_url = slug_image_url;
      }

      const slugResult = await retryWithBackoff(async () =>
        supabase.from("event_slug").insert([slugPayload]),
      );

      if (slugResult.error) {
        await rollbackEvent(eventId);
        throw new Error(
          `Couldn't save the detail images/description: ${slugResult.error.message}`,
        );
      }
    }

    // Create posters if provided
    if (data && data.length > 0 && poster_image_urls) {
      const eventId = data[0].id;
      const posterImages = poster_image_urls
        .split("|")
        .filter((url: string) => url.trim());

      if (posterImages.length > 0) {
        const posterPayloads = posterImages.map((poster_image_url: string) => ({
          event_id: eventId,
          poster_image_url: poster_image_url.trim(),
        }));

        const posterResult = await retryWithBackoff(async () =>
          supabase.from("posters").insert(posterPayloads),
        );

        if (posterResult.error) {
          await rollbackEvent(eventId);
          throw new Error(
            `Couldn't save the posters: ${posterResult.error.message}`,
          );
        }
      }
    }

    // Re-fetch the event with all related data
    if (data && data.length > 0) {
      const refetchResult = await retryWithBackoff(async () =>
        supabase
          .from("events")
          .select(
            `
            *,
            event_slug(*),
            posters(*)
          `,
          )
          .eq("id", data[0].id)
          .single(),
      );

      if (refetchResult.data) {
        data[0] = refetchResult.data;
      }
    }

    // Bust the ISR cache for all event-related public pages so the new event
    // appears immediately rather than after the next 60-second revalidation.
    revalidatePath("/events");
    revalidatePath("/gallery");
    revalidatePath("/");

    return NextResponse.json(
      { success: true, data: data?.[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create event",
      },
      { status: 500 },
    );
  }
}
