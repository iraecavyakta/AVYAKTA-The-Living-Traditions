import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "../../../../lib/auth/session";
import {
  listDomainLinks,
  saveDomainLinks,
} from "../../../../lib/config/domainLinks";
import { RECRUITMENT_DOMAINS } from "../../../../lib/validators/recruitment";

// Admin-only: applicants never call this, they get their own links from the
// submit response.
const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// Empty string clears the link; otherwise it must be an https WhatsApp URL.
const cleanUrl = (v: unknown): string | null | undefined => {
  const url = String(v ?? "").trim();
  if (!url) return null;
  return /^https:\/\/(chat\.whatsapp\.com|wa\.me)\//i.test(url)
    ? url
    : undefined;
};

export async function GET() {
  if (!(await verifyAdminAuth())) return unauthorized();
  try {
    return NextResponse.json({ data: await listDomainLinks() });
  } catch (error) {
    console.error("Error loading domain links:", error);
    return NextResponse.json(
      { error: "Failed to load links" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdminAuth())) return unauthorized();
  try {
    const body = await request.json();
    const domain = String(body.domain ?? "");
    if (!(RECRUITMENT_DOMAINS as readonly string[]).includes(domain)) {
      return NextResponse.json({ error: "Unknown domain" }, { status: 400 });
    }
    const first = cleanUrl(body.first_pref_url);
    const second = cleanUrl(body.second_pref_url);
    if (first === undefined || second === undefined) {
      return NextResponse.json(
        { error: "Links must start with https://chat.whatsapp.com/" },
        { status: 400 },
      );
    }
    await saveDomainLinks({
      domain,
      first_pref_url: first,
      second_pref_url: second,
    });
    return NextResponse.json({
      domain,
      first_pref_url: first,
      second_pref_url: second,
    });
  } catch (error) {
    console.error("Error saving domain links:", error);
    return NextResponse.json(
      { error: "Failed to save links" },
      { status: 500 },
    );
  }
}
