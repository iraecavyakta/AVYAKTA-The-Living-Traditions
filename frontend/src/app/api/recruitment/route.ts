import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase/server";
import { recruitmentSchema } from "../../../lib/validators/recruitment";
import { retryWithBackoff } from "../../../lib/api/retry";
import { getApplicantLinks } from "../../../lib/config/domainLinks";
import { sendMailAfterResponse } from "../../../lib/mail/send";
import {
  applicationReceivedEmail,
  editLinkEmail,
} from "../../../lib/mail/templates";
import {
  APPLICATION_COLUMNS,
  type ApplicationRow,
  editUrl,
  newEditToken,
  siteOrigin,
} from "../../../lib/recruitment/applications";
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
    const { token, hash } = newEditToken();
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
            edit_token_hash: hash,
          },
        ])
        .select(),
    );

    const { error } = result;
    if (error?.code === "23505") {
      // Unique SRN: this person already applied. Don't create a second
      // application - email the address on file a fresh edit link instead.
      return await handleDuplicate(request, data.srn);
    }
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

    const link = editUrl(siteOrigin(request), token);
    sendMailAfterResponse({
      to: data.email,
      ...applicationReceivedEmail({
        name: data.name,
        firstDomain: data.first_preference_domain,
        secondDomain: data.second_domain_preference,
        editUrl: link,
      }),
    });

    const links = await getApplicantLinks(
      data.first_preference_domain,
      data.second_domain_preference,
    );

    return NextResponse.json(
      {
        message: "Recruitment application submitted successfully",
        links,
        // Local testing only: in production the link reaches the candidate
        // by email and nowhere else.
        ...(process.env.NODE_ENV !== "production" && { devEditUrl: link }),
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

const RESEND_LIMIT = 2;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

/**
 * Same SRN submitted again. The response is identical whoever asks and never
 * reveals the email on file; the fresh link only goes to that inbox. Resends
 * are rate-limited per SRN so the form can't be used to spam someone.
 */
async function handleDuplicate(request: NextRequest, srn: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from("recruitment")
    .select(APPLICATION_COLUMNS)
    .eq("srn", srn)
    .maybeSingle<ApplicationRow>();

  if (
    existing &&
    rateLimit(`resend:${srn}`, RESEND_LIMIT, RESEND_WINDOW_MS).allowed
  ) {
    const { token, hash } = newEditToken(); // replaces any earlier link
    const { error } = await supabaseAdmin
      .from("recruitment")
      .update({ edit_token_hash: hash })
      .eq("id", existing.id);

    if (!error) {
      sendMailAfterResponse({
        to: existing.email,
        ...editLinkEmail({
          name: existing.name,
          editUrl: editUrl(siteOrigin(request), token),
        }),
      });
    }
  }

  return NextResponse.json(
    {
      error:
        "You've already applied with this SRN, so we haven't created a second application. We've emailed a private link to the address you applied with - use it to edit your application or track its status.",
      code: "ALREADY_APPLIED",
    },
    { status: 409 },
  );
}

// GET endpoint removed due to privacy concerns
// PII (email, phone) should not be exposed publicly
// If retrieval is needed, implement proper authentication/authorization
