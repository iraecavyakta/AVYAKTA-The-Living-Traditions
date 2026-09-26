import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { retryWithBackoff } from "../../../lib/api/retry";
import {
  verifySessionId,
  getSessionCookieName,
} from "../../../lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Helper to verify admin authentication
async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (!token) {
      return false;
    }

    const session = await verifySessionId(token);
    return session !== null;
  } catch {
    return false;
  }
}

type EventWritePayload = {
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  registration_deadline?: string | null;
  payment_image_required?: boolean;
};

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
    const {
      title,
      description,
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
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 },
      );
    }

    const insertPayload: EventWritePayload = {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: image_url || null,
      date: date || null,
    };

    // Only add optional fields if they're provided
    if (venue !== undefined) {
      insertPayload.venue = venue?.trim() || null;
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
        description: description?.trim() || null,
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
      const slugPayload: Record<string, unknown> = {
        event_id: eventId,
      };

      if (more_description) {
        slugPayload.more_description = more_description;
      }
      if (slug_image_url) {
        slugPayload.image_url = slug_image_url;
      }

      const slugResult = await retryWithBackoff(async () =>
        supabase.from("event_slug").insert([slugPayload]),
      );

      if (slugResult.error) {
        console.warn("Warning: Failed to create event slug:", slugResult.error);
        // Don't throw, just warn - event was created successfully
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
          console.warn(
            "Warning: Failed to create event posters:",
            posterResult.error,
          );
          // Don't throw, just warn - event was created successfully
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

    return NextResponse.json(
      { success: true, data: data?.[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 },
    );
  }
}
