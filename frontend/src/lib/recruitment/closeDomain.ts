import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { MailMessage } from "@/lib/mail/send";
import {
  decisionEmail,
  secondPreferenceClosedEmail,
} from "@/lib/mail/templates";

// A domain head closes recruitment because the team is full. Everyone still
// waiting on that domain is rejected for it, and told:
//
//  FIRST preference = this domain, not decided yet
//    -> rejected here (first_preference_status). If they named a second
//       preference they move into its second round - unless that domain has
//       already closed on them, in which case this is their final rejection.
//  SECOND preference = this domain, not decided yet
//    - already in the second round (first preference rejected): the usual
//      second-preference rejection, worded as "domain closed"
//    - still waiting on their first preference ("incoming"): a notice that the
//      second choice is gone; the first preference carries on. If it is later
//      rejected, the decision route sees the rejected second_preference row
//      and sends the final rejection with no "hold on".
//
// Anyone already accepted or rejected in this domain is skipped, so running it
// again finds nothing and sends nothing (idempotent).

type Candidate = {
  id: string;
  name: string;
  email: string;
  first_preference_domain: string;
  first_preference_status: string | null;
  second_domain_preference: string | null;
};

const COLUMNS =
  "id, name, email, first_preference_domain, first_preference_status, second_domain_preference";
const PAGE = 1000; // Supabase's per-request row cap
const CHUNK = 100; // ids per .in() filter, to keep request URLs short

const isFinal = (status: string | null | undefined) =>
  status === "approved" || status === "rejected";

const chunks = <T>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) =>
    items.slice(i * CHUNK, (i + 1) * CHUNK),
  );

async function fetchCandidates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: (query: any) => any,
): Promise<Candidate[]> {
  const supabase = getSupabaseAdmin();
  const rows: Candidate[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await filter(
      supabase.from("recruitment").select(COLUMNS),
    )
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to load candidates: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

/** second_preference.status by recruitment id, for the given candidates. */
async function secondStatuses(ids: string[]) {
  const supabase = getSupabaseAdmin();
  const map = new Map<string, string | null>();
  for (const part of chunks(ids)) {
    const { data, error } = await supabase
      .from("second_preference")
      .select("recruitment_id, second_preference_status")
      .in("recruitment_id", part);
    if (error)
      throw new Error(`Failed to load second preferences: ${error.message}`);
    for (const row of data ?? [])
      map.set(row.recruitment_id, row.second_preference_status);
  }
  return map;
}

async function dropNotes(domain: string, ids: string[]) {
  const supabase = getSupabaseAdmin();
  for (const part of chunks(ids)) {
    await supabase
      .from("recruitment_feedback")
      .delete()
      .eq("domain", domain)
      .in("recruitment_id", part);
  }
}

export async function rejectOpenCandidates(domain: string): Promise<{
  messages: MailMessage[];
  first: number;
  secondRound: number;
  incoming: number;
}> {
  const supabase = getSupabaseAdmin();
  const messages: MailMessage[] = [];

  // ---------------------------------------------------- first preference
  const firstPending = await fetchCandidates((q) =>
    q
      .eq("first_preference_domain", domain)
      .or(
        "first_preference_status.is.null,first_preference_status.in.(pending,not_sure)",
      ),
  );

  const firstSecond = await secondStatuses(firstPending.map((c) => c.id));

  for (const part of chunks(firstPending)) {
    const { error } = await supabase
      .from("recruitment")
      .update({ first_preference_status: "rejected" })
      .in(
        "id",
        part.map((c) => c.id),
      );
    if (error) throw new Error(`Failed to reject candidates: ${error.message}`);
  }

  // Into the second round, unless they have no second choice or already have
  // a second_preference row (rejected earlier because that domain closed).
  const needsSecondRow = firstPending.filter(
    (c) => c.second_domain_preference && !firstSecond.has(c.id),
  );
  if (needsSecondRow.length) {
    const { error } = await supabase.from("second_preference").insert(
      needsSecondRow.map((c) => ({
        recruitment_id: c.id,
        interview: false,
        second_preference_status: "pending",
      })),
    );
    if (error)
      throw new Error(`Failed to start second round: ${error.message}`);
  }
  await dropNotes(
    domain,
    firstPending.map((c) => c.id),
  );

  for (const c of firstPending) {
    const secondClosed =
      c.second_domain_preference && firstSecond.get(c.id) === "rejected";
    messages.push({
      to: c.email,
      ...decisionEmail({
        name: c.name,
        domain,
        accepted: false,
        preference: "first",
        domainClosed: true,
        nextDomain:
          c.second_domain_preference && !secondClosed
            ? c.second_domain_preference
            : null,
        secondClosedDomain: secondClosed ? c.second_domain_preference : null,
      }),
    });
  }

  // --------------------------------------------------- second preference
  const secondCandidates = await fetchCandidates((q) =>
    q
      .eq("second_domain_preference", domain)
      .or(
        "first_preference_status.is.null,first_preference_status.neq.approved",
      ),
  );
  const existing = await secondStatuses(secondCandidates.map((c) => c.id));
  const open = secondCandidates.filter((c) => !isFinal(existing.get(c.id)));
  const needsRow = open.filter((c) => !existing.has(c.id));
  const hasRow = open.filter((c) => existing.has(c.id));

  if (needsRow.length) {
    const { error } = await supabase.from("second_preference").insert(
      needsRow.map((c) => ({
        recruitment_id: c.id,
        interview: false,
        second_preference_status: "rejected",
      })),
    );
    if (error) throw new Error(`Failed to reject candidates: ${error.message}`);
  }
  for (const part of chunks(hasRow)) {
    const { error } = await supabase
      .from("second_preference")
      .update({ second_preference_status: "rejected" })
      .in(
        "recruitment_id",
        part.map((c) => c.id),
      );
    if (error) throw new Error(`Failed to reject candidates: ${error.message}`);
  }
  await dropNotes(
    domain,
    open.map((c) => c.id),
  );

  for (const c of open) {
    messages.push({
      to: c.email,
      ...(c.first_preference_status === "rejected"
        ? decisionEmail({
            name: c.name,
            domain,
            accepted: false,
            preference: "second",
            firstDomain: c.first_preference_domain,
            domainClosed: true,
          })
        : secondPreferenceClosedEmail({
            name: c.name,
            secondDomain: domain,
            firstDomain: c.first_preference_domain,
          })),
    });
  }

  const secondRound = open.filter(
    (c) => c.first_preference_status === "rejected",
  ).length;
  return {
    messages,
    first: firstPending.length,
    secondRound,
    incoming: open.length - secondRound,
  };
}
