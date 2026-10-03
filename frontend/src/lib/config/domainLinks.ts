import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Backed by `recruitment_domain_links` (one row per domain). RLS is on with no
// policies, so only the service-role client used here can read or write it.

export interface DomainLinks {
  domain: string;
  first_pref_url: string | null;
  second_pref_url: string | null;
}

export async function listDomainLinks(): Promise<DomainLinks[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("recruitment_domain_links")
    .select("domain, first_pref_url, second_pref_url");
  if (error) throw new Error(`Failed to load domain links: ${error.message}`);
  return data ?? [];
}

// Links for an applicant: first-pref link of their first domain, and the
// second-pref link of their second domain (if they chose one). Never throws -
// the application is already saved by the time this runs.
export async function getApplicantLinks(
  firstDomain: string,
  secondDomain?: string | null,
): Promise<{ first: string | null; second: string | null }> {
  try {
    const domains = [firstDomain, secondDomain].filter(Boolean) as string[];
    const { data } = await getSupabaseAdmin()
      .from("recruitment_domain_links")
      .select("domain, first_pref_url, second_pref_url")
      .in("domain", domains);
    const byDomain = new Map((data ?? []).map((r) => [r.domain, r]));
    return {
      first: byDomain.get(firstDomain)?.first_pref_url || null,
      second: secondDomain
        ? byDomain.get(secondDomain)?.second_pref_url || null
        : null,
    };
  } catch {
    return { first: null, second: null };
  }
}

export async function saveDomainLinks(row: DomainLinks): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("recruitment_domain_links")
    .upsert([{ ...row, updated_at: new Date().toISOString() }], {
      onConflict: "domain",
    });
  if (error) throw new Error(`Failed to save domain links: ${error.message}`);
}
