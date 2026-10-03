import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";
import { recruitmentSchema } from "../../../lib/validators/recruitment";
import { retryWithBackoff } from "../../../lib/api/retry";
import { getApplicantLinks } from "../../../lib/config/domainLinks";
import { getClientIp, rateLimit } from "../../../lib/security/rateLimit";

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limitResult = rateLimit(
      `recruitment:${ip}`,
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

    // Server-side validation
    const validation = recruitmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.error.flatten() },
        { status: 400 },
      );
    }

    const data = validation.data;

    // links already validated by schema (parsed JSON array with size/length limits)
    const supabaseAdmin = getSupabaseAdmin();
    const result = await retryWithBackoff(async () =>
      supabaseAdmin
        .from("recruitment")
        .insert([
          {
            name: data.name,
            email: data.email,
            phone_no: data.phone_number,
            first_preference_domain: data.first_preference_domain,
            srn: data.srn,
            year: data.year ?? null,
            branch: data.branch || null,
            section: data.section || null,
            links: data.links ?? null,
            experience: data.experience ?? null,
            why_you: data.why_you,
            why_us: data.why_us,
            second_domain_preference: data.second_domain_preference || null,
          },
        ])
        .select(),
    );

    const { error } = result;
    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          error: "Failed to submit recruitment application",
          code: "RECRUITMENT_INSERT_FAILED",
        },
        { status: 500 },
      );
    }

    const links = await getApplicantLinks(
      data.first_preference_domain,
      data.second_domain_preference,
    );

    return NextResponse.json(
      {
        message: "Recruitment application submitted successfully",
        links,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Recruitment submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit recruitment application" },
      { status: 500 },
    );
  }
}

// GET endpoint removed due to privacy concerns
// PII (email, phone) should not be exposed publicly
// If retrieval is needed, implement proper authentication/authorization
