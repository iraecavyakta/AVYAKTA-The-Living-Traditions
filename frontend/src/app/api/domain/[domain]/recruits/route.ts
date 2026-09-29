import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";
import { domainReadAliases } from "@/lib/utils/domains";

type RecruitmentRow = {
  id: string;
  name: string;
  srn: string;
  email: string;
  phone_no: string;
  year: number;
  branch: string;
  section: string;
  links: string | null;
  experience: string | null;
  why_you: string;
  why_us: string;
  first_preference_domain: string;
  first_preference_status: string | null;
  second_domain_preference: string | null;
  interview: boolean | null;
};

const RECRUIT_COLUMNS =
  "id, name, srn, email, phone_no, year, branch, section, links, experience, why_you, why_us, first_preference_domain, first_preference_status, second_domain_preference, interview";

type SecondPreferenceRow = {
  id: string;
  recruitment_id: string;
  interview: boolean | null;
  second_preference_status: string | null;
};

type CounterRow = {
  domain: string;
  not_sure: number;
  approved: number;
  rejected: number;
};

type IndicatorRow = {
  id: string;
  domain: string;
  indicator: boolean | null;
};

const normalizeStatus = (status: string | null | undefined) =>
  status === "not_sure" || !status ? "pending" : status;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    const { domain } = await params;

    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 404 });
    }

    const displayDomain = formatDomainFromUrl(domain);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: firstPreferenceData, error: firstError } = await supabaseAdmin
      .from("recruitment")
      .select(RECRUIT_COLUMNS)
      .in("first_preference_domain", domainReadAliases(displayDomain))
      .order("name", { ascending: true });

    if (firstError) {
      return NextResponse.json(
        { error: "Failed to fetch first preference recruits" },
        { status: 500 },
      );
    }

    const { data: secondPreferenceLinkRows, error: secondPrefLinkError } =
      await supabaseAdmin
        .from("recruitment")
        .select("id")
        .in("second_domain_preference", domainReadAliases(displayDomain));

    if (secondPrefLinkError) {
      return NextResponse.json(
        { error: "Failed to fetch second preference recruits" },
        { status: 500 },
      );
    }

    const recruitIds = (secondPreferenceLinkRows ?? []).map((row) => row.id);
    let secondPreferenceData: (RecruitmentRow & {
      second_preference_id?: string;
      second_preference_interview?: boolean | null;
      second_preference_status?: string | null;
    })[] = [];

    if (recruitIds.length > 0) {
      const [{ data: recruitRows }, { data: secondPrefRows }] =
        await Promise.all([
          supabaseAdmin
            .from("recruitment")
            .select(RECRUIT_COLUMNS)
            .in("id", recruitIds),
          supabaseAdmin
            .from("second_preference")
            .select("id, recruitment_id, interview, second_preference_status")
            .in("recruitment_id", recruitIds),
        ]);

      secondPreferenceData = (recruitRows ?? []).map((row) => {
        const secondPref = (secondPrefRows ?? []).find(
          (candidate) => candidate.recruitment_id === row.id,
        ) as SecondPreferenceRow | undefined;

        return {
          ...row,
          second_preference_id: secondPref?.id,
          second_preference_interview: secondPref?.interview ?? null,
          second_preference_status: normalizeStatus(
            secondPref?.second_preference_status,
          ),
        };
      });

      secondPreferenceData = secondPreferenceData.filter(
        (row) => row.first_preference_status === "rejected",
      );
    }

    const firstPreferenceVisible = (firstPreferenceData ?? []).filter(
      (recruit) => recruit.first_preference_status !== "rejected",
    );

    const counter: CounterRow = {
      domain: displayDomain,
      not_sure: 0,
      approved: 0,
      rejected: 0,
    };

    for (const recruit of firstPreferenceData ?? []) {
      if (recruit.first_preference_status === "approved") {
        counter.approved += 1;
      } else if (recruit.first_preference_status === "rejected") {
        counter.rejected += 1;
      } else {
        counter.not_sure += 1;
      }
    }

    for (const recruit of secondPreferenceData) {
      if (recruit.second_preference_status === "approved") {
        counter.approved += 1;
      } else if (recruit.second_preference_status === "rejected") {
        counter.rejected += 1;
      } else {
        counter.not_sure += 1;
      }
    }

    const { data: existingIndicator, error: indicatorError } =
      await supabaseAdmin
        .from("indicator")
        .select("id, domain, indicator")
        .eq("domain", displayDomain)
        .maybeSingle();

    let indicator: IndicatorRow | null = null;

    if (existingIndicator) {
      indicator = existingIndicator;
    } else if (!indicatorError) {
      const { data: insertedIndicator } = await supabaseAdmin
        .from("indicator")
        .insert([{ domain: displayDomain, indicator: false }])
        .select("id, domain, indicator")
        .single();

      indicator = insertedIndicator ?? null;
    }

    return NextResponse.json(
      {
        firstPreference: firstPreferenceVisible,
        secondPreference: secondPreferenceData,
        counter,
        indicator,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in domain recruits endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
