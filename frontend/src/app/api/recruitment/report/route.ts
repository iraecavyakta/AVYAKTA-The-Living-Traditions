import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/auth/session";
import { RECRUITMENT_DOMAINS } from "@/lib/validators/recruitment";

// Admin-only CSV: per domain, how many candidates were accepted / rejected /
// pending as a first preference and as a second preference. Counts only - no
// candidate details leave the database through this route.
//
// A candidate only counts as a second-preference candidate of a domain once
// they have been REJECTED in their first preference (that is the only way
// they reach the second round), matching the domain dashboards.

type Counts = { approved: number; rejected: number; pending: number };

const empty = (): Counts => ({ approved: 0, rejected: 0, pending: 0 });
const total = (c: Counts) => c.approved + c.rejected + c.pending;

const bucket = (status: string | null | undefined): keyof Counts =>
  status === "approved"
    ? "approved"
    : status === "rejected"
      ? "rejected"
      : "pending";

// Supabase returns at most 1000 rows per request, so page through the table.
async function fetchAll<T>(
  table: string,
  columns: string,
  orderBy: string,
): Promise<T[]> {
  const supabase = getSupabaseAdmin();
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy)
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

const csvCell = (value: string | number) =>
  /[",\n]/.test(String(value))
    ? `"${String(value).replace(/"/g, '""')}"`
    : String(value);

export async function GET() {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [recruits, seconds] = await Promise.all([
      fetchAll<{
        id: string;
        first_preference_domain: string;
        first_preference_status: string | null;
        second_domain_preference: string | null;
      }>(
        "recruitment",
        "id, first_preference_domain, first_preference_status, second_domain_preference",
        "id",
      ),
      fetchAll<{
        recruitment_id: string;
        second_preference_status: string | null;
      }>(
        "second_preference",
        "recruitment_id, second_preference_status",
        "recruitment_id",
      ),
    ]);

    const secondStatus = new Map(
      seconds.map((row) => [row.recruitment_id, row.second_preference_status]),
    );

    const first = new Map<string, Counts>(
      RECRUITMENT_DOMAINS.map((d) => [d, empty()]),
    );
    const second = new Map<string, Counts>(
      RECRUITMENT_DOMAINS.map((d) => [d, empty()]),
    );

    // Unknown (retired) domain names are simply not counted.
    const tally = (
      map: Map<string, Counts>,
      domain: string,
      status: string | null | undefined,
    ) => {
      const counts = map.get(domain);
      if (counts) counts[bucket(status)]++;
    };

    for (const recruit of recruits) {
      tally(
        first,
        recruit.first_preference_domain,
        recruit.first_preference_status,
      );

      if (
        recruit.second_domain_preference &&
        recruit.first_preference_status === "rejected"
      ) {
        // No second_preference row yet just means the second round is pending.
        tally(
          second,
          recruit.second_domain_preference,
          secondStatus.get(recruit.id),
        );
      }
    }

    const header = [
      "Domain",
      "1st Pref - Accepted",
      "1st Pref - Rejected",
      "1st Pref - Pending",
      "1st Pref - Total",
      "2nd Pref - Accepted",
      "2nd Pref - Rejected",
      "2nd Pref - Pending",
      "2nd Pref - Total",
    ];

    const line = (label: string, a: Counts, b: Counts) => [
      label,
      a.approved,
      a.rejected,
      a.pending,
      total(a),
      b.approved,
      b.rejected,
      b.pending,
      total(b),
    ];

    const sum = (maps: Map<string, Counts>) =>
      [...maps.values()].reduce(
        (acc, c) => ({
          approved: acc.approved + c.approved,
          rejected: acc.rejected + c.rejected,
          pending: acc.pending + c.pending,
        }),
        empty(),
      );

    const rows = [
      header,
      ...RECRUITMENT_DOMAINS.map((d) => line(d, first.get(d)!, second.get(d)!)),
      line("All domains", sum(first), sum(second)),
    ];

    const csv =
      "﻿" + // BOM so Excel reads it as UTF-8
      rows.map((r) => r.map(csvCell).join(",")).join("\r\n") +
      "\r\n";

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="avyakta-recruitment-report-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error building recruitment report:", error);
    return NextResponse.json(
      { error: "Failed to build report" },
      { status: 500 },
    );
  }
}
