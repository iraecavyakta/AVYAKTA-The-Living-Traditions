import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// A candidate edits / tracks their application through a private link emailed
// to them: /recruitment/edit?token=<secret>. Only a SHA-256 hash of the secret
// is stored (recruitment.edit_token_hash), so a database leak doesn't leak
// working links. Owning the inbox is the only proof required.

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url

export const APPLICATION_COLUMNS =
  "id, name, email, srn, year, branch, section, phone_no, first_preference_domain, second_domain_preference, experience, links, why_you, why_us, interview, first_preference_status";

export type ApplicationRow = {
  id: string;
  name: string;
  email: string;
  srn: string;
  year: number;
  branch: string;
  section: string;
  phone_no: string;
  first_preference_domain: string;
  second_domain_preference: string | null;
  experience: string | null;
  links: string | null;
  why_you: string;
  why_us: string;
  interview: boolean | null;
  first_preference_status: string | null;
};

export type Stage =
  | "received"
  | "interviewed"
  | "second_preference"
  | "decided";

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function newEditToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

/** Public base URL for links in emails. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteOrigin(request: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).replace(
    /\/$/,
    "",
  );
}

export const editUrl = (origin: string, token: string) =>
  `${origin}/recruitment/edit?token=${token}`;

export async function findApplicationByToken(
  token: string | null | undefined,
): Promise<ApplicationRow | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null;

  const { data } = await getSupabaseAdmin()
    .from("recruitment")
    .select(APPLICATION_COLUMNS)
    .eq("edit_token_hash", hashToken(token))
    .maybeSingle();

  return (data as ApplicationRow | null) ?? null;
}

const normalizeStatus = (status: string | null | undefined) =>
  status === "not_sure" || !status ? "pending" : status;

/** Editable until the first-preference interview is marked done or a decision is made. */
export const isEditable = (app: ApplicationRow, recruitmentOpen: boolean) =>
  recruitmentOpen &&
  !app.interview &&
  normalizeStatus(app.first_preference_status) === "pending";

/** Where the application is, without revealing which way a decision went. */
export async function getStage(app: ApplicationRow): Promise<Stage> {
  const first = normalizeStatus(app.first_preference_status);

  if (first === "approved") return "decided";

  if (first === "rejected") {
    if (!app.second_domain_preference) return "decided";

    const { data } = await getSupabaseAdmin()
      .from("second_preference")
      .select("second_preference_status")
      .eq("recruitment_id", app.id)
      .maybeSingle();
    const second = normalizeStatus(data?.second_preference_status);
    return second === "approved" || second === "rejected"
      ? "decided"
      : "second_preference";
  }

  return app.interview ? "interviewed" : "received";
}

export function parseLinks(links: string | null): string[] {
  if (!links) return [];
  try {
    const parsed = JSON.parse(links);
    return Array.isArray(parsed)
      ? parsed.filter((link): link is string => typeof link === "string")
      : [];
  } catch {
    return [];
  }
}
