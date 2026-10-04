import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, event_slug, posters } from "@drizzle/schema";
import { adminEventSchema } from "@/lib/validators/adminEvent";
import { verifyAdminAuth } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const result = await db.transaction(async (tx) => {
      const [createdEvent] = await tx
        .insert(events)
        .values({
          title: data.title.trim(),
          description: data.description.trim(),
          domain: data.domain.trim(),
          highlights: data.highlights?.trim() || null,
          timeline: data.timeline?.trim() || null,
          image_url: data.detailImageUrl?.trim() || null,
          date: data.date?.trim() || null,
        })
        .returning({ id: events.id, title: events.title });

      if (data.moreDescription?.trim() || data.detailImageUrl?.trim()) {
        await tx.insert(event_slug).values({
          event_id: createdEvent.id,
          title: createdEvent.title,
          more_description: data.moreDescription?.trim() || null,
          image_url: data.detailImageUrl?.trim() || null,
        });
      }

      if (data.thumbnailUrl?.trim()) {
        await tx.insert(posters).values({
          event_id: createdEvent.id,
          title: createdEvent.title,
          poster_image_url: data.thumbnailUrl.trim(),
        });
      }

      return createdEvent;
    });

    return NextResponse.json(
      {
        message: "Event created successfully",
        eventId: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Event creation error:", error);

    const postgresCode =
      typeof error === "object" && error !== null
        ? (("code" in error && typeof error.code === "string"
            ? error.code
            : null) ??
          ("cause" in error &&
          typeof error.cause === "object" &&
          error.cause !== null &&
          "code" in error.cause &&
          typeof error.cause.code === "string"
            ? error.cause.code
            : null))
        : null;

    if (postgresCode === "23505") {
      return NextResponse.json(
        { error: "An event with this title already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
