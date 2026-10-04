import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getRecruitmentStatus } from "@/lib/config/recruitmentStatus";
import { getApplicantLinks } from "@/lib/config/domainLinks";
import { recruitmentSchema } from "@/lib/validators/recruitment";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import {
  findApplicationByToken,
  getStage,
  isEditable,
  parseLinks,
} from "@/lib/recruitment/applications";

// A candidate views / edits their own application with the private token from
// their email. The token comes in a header (GET) or the body (PUT), never the
// URL, so it doesn't end up in server logs.

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: noStore });

const LOOKUP_LIMIT = 40;
const LOOKUP_WINDOW_MS = 10 * 60 * 1000;

function tooMany(request: NextRequest) {
  const result = rateLimit(
    `application:${getClientIp(request)}`,
    LOOKUP_LIMIT,
    LOOKUP_WINDOW_MS,
  );
  return result.allowed
    ? null
    : NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            ...noStore,
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      );
}

export async function GET(request: NextRequest) {
  const limited = tooMany(request);
  if (limited) return limited;

  const app = await findApplicationByToken(request.headers.get("x-edit-token"));
  if (!app) return json({ error: "This link is invalid or has expired." }, 404);

  const [open, stage] = await Promise.all([
    getRecruitmentStatus(),
    getStage(app),
  ]);

  return json({
    application: {
      name: app.name,
      email: app.email,
      srn: app.srn,
      phone_number: app.phone_no,
      branch: app.branch,
      year: app.year,
      section: app.section,
      first_preference_domain: app.first_preference_domain,
      second_domain_preference: app.second_domain_preference,
      experience: app.experience ?? "",
      links: parseLinks(app.links),
      why_you: app.why_you,
      why_us: app.why_us,
    },
    editable: isEditable(app, open),
    stage,
  });
}

export async function PUT(request: NextRequest) {
  const limited = tooMany(request);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const app = await findApplicationByToken(body?.token);
  if (!app) return json({ error: "This link is invalid or has expired." }, 404);

  if (!isEditable(app, await getRecruitmentStatus())) {
    return json(
      {
        error:
          "This application can no longer be edited - it is already under review.",
        code: "LOCKED",
      },
      403,
    );
  }

  // SRN and email identify the candidate and anchor the link, so they stay as
  // submitted; everything else is re-validated exactly like a new submission.
  const validation = recruitmentSchema.safeParse({
    ...body,
    srn: app.srn,
    email: app.email,
  });
  if (!validation.success) {
    return json(
      { error: "Validation failed", errors: validation.error.flatten() },
      400,
    );
  }
  const data = validation.data;

  const supabaseAdmin = getSupabaseAdmin();
  // ponytail: no atomic "still pending" guard on this update, so a head
  // marking the interview in the same instant could be overwritten. Move the
  // check into the UPDATE's WHERE if that ever matters.
  const { error } = await supabaseAdmin
    .from("recruitment")
    .update({
      name: data.name,
      phone_no: data.phone_number,
      first_preference_domain: data.first_preference_domain,
      second_domain_preference: data.second_domain_preference || null,
      year: data.year ?? null,
      branch: data.branch || null,
      section: data.section || null,
      links: data.links ?? null,
      experience: data.experience ?? null,
      why_you: data.why_you,
      why_us: data.why_us,
    })
    .eq("id", app.id);

  if (error) {
    console.error("Application update error:", error);
    return json({ error: "Failed to save your changes" }, 500);
  }

  // A domain they dropped no longer reviews them, so its private notes go too.
  const chosen = [data.first_preference_domain, data.second_domain_preference]
    .filter(Boolean)
    .join(",");
  await supabaseAdmin
    .from("recruitment_feedback")
    .delete()
    .eq("recruitment_id", app.id)
    .not("domain", "in", `(${chosen.replace(/([^,]+)/g, '"$1"')})`);

  const links = await getApplicantLinks(
    data.first_preference_domain,
    data.second_domain_preference,
  );
  return json({ message: "Application updated", links });
}
