import { NextRequest, NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/auth/domainAccess";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";

// Private reviewer notes. Keyed by (candidate, domain): a head only ever reads
// or writes the note for their own domain, so the first- and second-preference
// heads never see each other's notes. Candidates have no route to this table.

const MAX_LENGTH = 2000;

type Ctx = { params: Promise<{ domain: string; id: string }> };

/** Validates login + domain scope + that the candidate applied to this domain. */
async function authorize({ params }: Ctx) {
  const { domain, id } = await params;
  const fail = (error: string, status: number) => ({
    error: NextResponse.json({ error }, { status }),
  });

  if (!isValidDomain(domain) || !id) return fail("Not found", 404);

  const denied = await requireDomainAccess(domain);
  if (denied) return { error: denied };

  const key = formatDomainFromUrl(domain);

  const { data: recruit } = await getSupabaseAdmin()
    .from("recruitment")
    .select("first_preference_domain, second_domain_preference")
    .eq("id", id)
    .maybeSingle();

  const applied =
    recruit &&
    (recruit.first_preference_domain === key ||
      recruit.second_domain_preference === key);
  if (!applied) return fail("Recruit not found in this domain", 404);

  return { id, key };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await authorize(ctx);
  if ("error" in auth) return auth.error;

  const { data, error } = await getSupabaseAdmin()
    .from("recruitment_feedback")
    .select("feedback")
    .eq("recruitment_id", auth.id)
    .eq("domain", auth.key)
    .maybeSingle();

  if (error) {
    console.error("Error loading feedback:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json({ feedback: data?.feedback ?? "" });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await authorize(ctx);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const feedback = String(body.feedback ?? "").trim();
  if (feedback.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Feedback must be ${MAX_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const { error } = await getSupabaseAdmin()
    .from("recruitment_feedback")
    .upsert(
      [
        {
          recruitment_id: auth.id,
          domain: auth.key,
          feedback,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "recruitment_id,domain" },
    );

  if (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  return NextResponse.json({ feedback });
}
