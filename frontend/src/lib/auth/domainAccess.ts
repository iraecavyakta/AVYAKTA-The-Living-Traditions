import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";

/**
 * Gate for /api/domain/[domain]/... handlers (the login proxy doesn't cover
 * /api). Requires a session; a domain head may only touch their own domain,
 * the full admin (session.domain === null) may touch any.
 * Returns an error response to send back, or null when access is allowed.
 */
export async function requireDomainAccess(
  domainSlug: string,
): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.domain && session.domain !== formatDomainFromUrl(domainSlug)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
