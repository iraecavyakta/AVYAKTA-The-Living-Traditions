import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { retryWithBackoff } from "../../../../lib/api/retry";
import { RECRUITMENT_DOMAINS } from "../../../../lib/validators/recruitment";
import { verifyAdminAuth } from "../../../../lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const normalizeStatus = (status: string | null | undefined) =>
  status === "not_sure" || !status ? "pending" : status;

// GET - Compute live counter stats for all domains directly from recruitment
// data, so this always matches what each domain dashboard shows (the
// persisted `counter` table drifts because it's never updated on new
// submissions, only on status transitions).
export async function GET() {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const [
      { data: recruits, error: recruitsError },
      { data: secondPrefRows, error: secondPrefError },
    ] = await Promise.all([
      retryWithBackoff(async () =>
        supabase
          .from("recruitment")
          .select(
            "id, first_preference_domain, first_preference_status, second_domain_preference",
          ),
      ),
      retryWithBackoff(async () =>
        supabase
          .from("second_preference")
          .select("recruitment_id, second_preference_status"),
      ),
    ]);

    if (recruitsError) throw new Error(recruitsError.message);
    if (secondPrefError) throw new Error(secondPrefError.message);

    const secondPrefByRecruitId = new Map(
      (secondPrefRows ?? []).map((row) => [
        row.recruitment_id,
        row.second_preference_status,
      ]),
    );

    const data = RECRUITMENT_DOMAINS.map((domain) => {
      const counter = { domain, not_sure: 0, approved: 0, rejected: 0 };

      for (const recruit of recruits ?? []) {
        if (recruit.first_preference_domain === domain) {
          const status = normalizeStatus(recruit.first_preference_status);
          if (status === "approved") counter.approved += 1;
          else if (status === "rejected") counter.rejected += 1;
          else counter.not_sure += 1;
        }

        if (
          recruit.second_domain_preference &&
          recruit.second_domain_preference === domain &&
          recruit.first_preference_status === "rejected"
        ) {
          const status = normalizeStatus(secondPrefByRecruitId.get(recruit.id));
          if (status === "approved") counter.approved += 1;
          else if (status === "rejected") counter.rejected += 1;
          else counter.not_sure += 1;
        }
      }

      return counter;
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching counter stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch counter stats" },
      { status: 500 },
    );
  }
}

// PUT - Reset counter for a specific domain or all domains
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { domain, flushAll } = body;

    if (!domain && !flushAll) {
      return NextResponse.json(
        { success: false, error: "Domain or flushAll flag is required" },
        { status: 400 },
      );
    }

    if (flushAll) {
      // Reset all domains - need a WHERE clause for safety
      const result = await retryWithBackoff(async () =>
        supabase
          .from("counter")
          .update({
            not_sure: 0,
            approved: 0,
            rejected: 0,
          })
          .neq("domain", null)
          .select(),
      );

      const { data, error } = result;
      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true, data: data });
    } else {
      // Reset specific domain
      const result = await retryWithBackoff(async () =>
        supabase
          .from("counter")
          .update({
            not_sure: 0,
            approved: 0,
            rejected: 0,
          })
          .eq("domain", domain)
          .select(),
      );

      const { data, error } = result;
      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true, data: data?.[0] });
    }
  } catch (error) {
    console.error("Error resetting counter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset counter" },
      { status: 500 },
    );
  }
}
