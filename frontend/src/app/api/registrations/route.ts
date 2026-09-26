import { NextRequest, NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validators/registration";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

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

    const { error } = await supabaseAdmin.from("registration").insert([
      {
        event_id: data.eventSelector,
        name: data.name,
        email: data.email,
        branch: data.branch,
        class_year: data.classYear,
        section: data.section,
        srn: data.srn,
        phone_no: data.phone_number,
        is_volunteer: data.isVolunteer,
        team_name: data.teamName || null,
        dietary_needs: data.dietaryNeeds || null,
        volunteer_domain: data.volunteerDomain || null,
        volunteer_experience: data.volunteerExperience || null,
        links: data.links || null,
      },
    ]);

    if (error) {
      console.error("Registration insert error:", error);
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
