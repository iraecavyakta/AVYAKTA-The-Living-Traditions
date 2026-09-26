import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { retryWithBackoff } from "../../../../lib/api/retry";
import { verifyAdminAuth } from "../../../../lib/auth/session";
import { eventUpdateSchema } from "../../../../lib/validators/event";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type EventUpdatePayload = {
  title?: string;
  description?: string;
  image_url?: string | null;
  date?: string | null;
  venue?: string | null;
  registration_enabled?: boolean;
  registration_status?: boolean;
  registration_deadline?: string | null;
  payment_image_required?: boolean;
};

// GET - Fetch a single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
        .eq("id", id)
        .maybeSingle(),
    );

    const { data, error } = result;
    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event" },
      { status: 500 },
    );
  }
}

// PUT - Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await request.json();
    const validation = eventUpdateSchema.safeParse(body);
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

    const updatePayload: EventUpdatePayload = {};

    // Only add fields that are provided
    if (title !== undefined) updatePayload.title = title?.trim();
    if (description !== undefined)
      updatePayload.description = description?.trim();
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (date !== undefined) updatePayload.date = date;
    if (venue !== undefined) updatePayload.venue = venue?.trim() || null;
    if (registration_enabled !== undefined)
      updatePayload.registration_enabled = registration_enabled;
    if (registration_status !== undefined)
      updatePayload.registration_status = registration_status;
    if (registration_deadline !== undefined)
      updatePayload.registration_deadline = registration_deadline || null;
    if (payment_image_required !== undefined)
      updatePayload.payment_image_required = payment_image_required;

    const result = await retryWithBackoff(async () =>
      supabase
        .from("events")
        .update(updatePayload)
        .eq("id", id)
        .select(
          `
          *,
          event_slug(*),
          posters(*)
        `,
        ),
    );

    let { data, error } = result;

    // If error is about missing columns, retry without those fields
    if (
      error &&
      (error.message.includes("registration_enabled") ||
        error.message.includes("payment_image_required"))
    ) {
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.registration_enabled;
      delete fallbackPayload.payment_image_required;

      const fallbackResult = await retryWithBackoff(async () =>
        supabase
          .from("events")
          .update(fallbackPayload)
          .eq("id", id)
          .select(
            `
            *,
            event_slug(*),
            posters(*)
          `,
          ),
      );

      data = fallbackResult.data as typeof data;
      error = fallbackResult.error as typeof error;
    }

    if (error) throw new Error(error.message);

    // Handle slug update
    if (
      data &&
      data.length > 0 &&
      (more_description !== undefined || slug_image_url !== undefined)
    ) {
      const eventId = data[0].id;
      const existingSlug = data[0].event_slug?.[0];

      if (existingSlug) {
        // Update existing slug
        const slugUpdatePayload: Record<string, unknown> = {};
        if (more_description !== undefined) {
          slugUpdatePayload.more_description = more_description;
        }
        if (slug_image_url !== undefined) {
          slugUpdatePayload.image_url = slug_image_url;
        }

        const slugUpdateResult = await retryWithBackoff(async () =>
          supabase
            .from("event_slug")
            .update(slugUpdatePayload)
            .eq("id", existingSlug.id),
        );

        if (slugUpdateResult.error) {
          console.warn(
            "Warning: Failed to update event slug:",
            slugUpdateResult.error,
          );
        }
      } else if (more_description || slug_image_url) {
        // Create new slug if it doesn't exist
        const slugPayload: Record<string, unknown> = {
          event_id: eventId,
        };

        if (more_description) {
          slugPayload.more_description = more_description;
        }
        if (slug_image_url) {
          slugPayload.image_url = slug_image_url;
        }

        const slugCreateResult = await retryWithBackoff(async () =>
          supabase.from("event_slug").insert([slugPayload]),
        );

        if (slugCreateResult.error) {
          console.warn(
            "Warning: Failed to create event slug:",
            slugCreateResult.error,
          );
        }
      }

      // Re-fetch the event with updated slug data
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
          .eq("id", eventId)
          .single(),
      );

      if (refetchResult.data) {
        data[0] = refetchResult.data;
      }
    }

    // Handle poster update/create
    if (data && data.length > 0 && poster_image_urls !== undefined) {
      const eventId = data[0].id;
      const posterImages = poster_image_urls
        .split("|")
        .filter((url: string) => url.trim());

      // Delete existing posters
      const deleteResult = await retryWithBackoff(async () =>
        supabase.from("posters").delete().eq("event_id", eventId),
      );

      if (deleteResult.error) {
        console.warn(
          "Warning: Failed to delete old posters:",
          deleteResult.error,
        );
      }

      // Create new posters if any provided
      if (posterImages.length > 0) {
        const posterPayloads = posterImages.map((poster_image_url: string) => ({
          event_id: eventId,
          poster_image_url: poster_image_url.trim(),
        }));

        const createResult = await retryWithBackoff(async () =>
          supabase.from("posters").insert(posterPayloads),
        );

        if (createResult.error) {
          console.warn(
            "Warning: Failed to create event posters:",
            createResult.error,
          );
        }
      }

      // Re-fetch the event with all updated data
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
          .eq("id", eventId)
          .single(),
      );

      if (refetchResult.data) {
        data[0] = refetchResult.data;
      }
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 },
    );
  }
}

// DELETE - Delete an event (cascade deletes related records)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const result = await retryWithBackoff(async () =>
      supabase.from("events").delete().eq("id", id),
    );

    const { error } = result;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
