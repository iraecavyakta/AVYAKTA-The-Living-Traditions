import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";
import {
  verifySessionId,
  getSessionCookieName,
} from "../../../../lib/auth/session";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";

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

type RecruitmentReportRow = {
  id: string;
  name: string;
  email: string;
  phone_no: string;
  srn: string;
  branch: string;
  section: string;
  year: number;
  first_preference_domain: string;
  second_domain_preference: string | null;
  experience: string | null;
  why_you: string;
  why_us: string;
  first_preference_status: string | null;
  interview: boolean | null;
  created_at?: string;
};

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const domainInput = typeof body.domain === "string" ? body.domain : "";

    if (!domainInput) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 },
      );
    }

    const domain = isValidDomain(domainInput)
      ? formatDomainFromUrl(domainInput)
      : domainInput;

    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: recruits, error: recruitsError }, { data: counters }] =
      await Promise.all([
        supabaseAdmin
          .from("recruitment")
          .select(
            "id, name, email, phone_no, srn, branch, section, year, first_preference_domain, second_domain_preference, experience, why_you, why_us, first_preference_status, interview, created_at",
          )
          .eq("first_preference_domain", domain)
          .order("created_at", { ascending: false })
          .returns<RecruitmentReportRow[]>(),
        supabaseAdmin
          .from("counter")
          .select("domain, not_sure, approved, rejected")
          .eq("domain", domain)
          .maybeSingle(),
      ]);

    if (recruitsError) {
      return NextResponse.json(
        { error: "Failed to fetch recruitment data" },
        { status: 500 },
      );
    }

    const stats = (recruits ?? []).reduce(
      (accumulator, recruit) => {
        if (recruit.first_preference_status === "approved") {
          accumulator.approved += 1;
        } else if (recruit.first_preference_status === "rejected") {
          accumulator.rejected += 1;
        } else {
          accumulator.not_sure += 1;
        }

        if (recruit.interview) {
          accumulator.interview += 1;
        }

        return accumulator;
      },
      {
        not_sure: 0,
        approved: 0,
        rejected: 0,
        interview: 0,
      },
    );

    return NextResponse.json(
      {
        domain,
        total_count: recruits?.length ?? 0,
        recruits: recruits ?? [],
        generated_at: new Date().toISOString(),
        stats,
        counter: counters ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
