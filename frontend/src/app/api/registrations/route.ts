import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { registrationSchema } from "@/lib/validators/registration";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { retryWithBackoff } from "@/lib/api/retry";
import { verifySessionId, getSessionCookieName } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limitResult = rateLimit(
      `registration:${ip}`,
      SUBMIT_LIMIT,
      SUBMIT_WINDOW_MS,
    );
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limitResult.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("payment_image_required")
      .eq("id", data.eventSelector)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.payment_image_required && !data.payment_image_url) {
      return NextResponse.json(
        { error: "Payment proof is required for this event" },
        { status: 400 },
      );
    }

    const result = await retryWithBackoff(async () =>
      supabaseAdmin
        .from("registration")
        .insert([
          {
            event_id: data.eventSelector,
            name: data.name,
            srn: data.srn,
            branch: data.branch,
            hostel: data.hostel,
            email: data.email,
            phone_no: data.phone_number,
            payment_image_url: data.payment_image_url || null,
            is_volunteer: data.isVolunteer,
            class_year: data.classYear,
            section: data.section,
            dietary_needs: data.dietaryNeeds || null,
            team_name: data.teamName || null,
            volunteer_domain: data.volunteerDomain || null,
            volunteer_experience: data.volunteerExperience || null,
            links: data.links || null,
          },
        ])
        .select(),
    );

    const { error } = result;
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to submit registration" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 },
    );
  }
}

// GET - Admin only: fetch registrants for a given event
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = request.nextUrl.searchParams.get("eventId");
    if (!eventId) {
      return NextResponse.json(
        { error: "eventId query parameter is required" },
        { status: 400 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("registration")
      .select(
        "id, event_id, name, srn, branch, hostel, email, phone_no, payment_image_url, is_volunteer, class_year, section, dietary_needs, team_name, volunteer_domain, volunteer_experience, links",
      )
      .eq("event_id", eventId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching registrants:", error);
      return NextResponse.json(
        { error: "Failed to fetch registrants" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (error) {
    console.error("Error in get registrants endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
