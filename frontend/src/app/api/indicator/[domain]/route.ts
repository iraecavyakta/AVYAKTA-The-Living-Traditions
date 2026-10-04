import { NextRequest, NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/auth/domainAccess";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendMailsAfterResponse } from "@/lib/mail/send";
import { rejectOpenCandidates } from "@/lib/recruitment/closeDomain";
import { formatDomainFromUrl } from "@/lib/utils/domainFormatter";
import { isValidDomain } from "@/lib/utils/domainValidator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    const { domain } = await params;

    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 404 });
    }

    const denied = await requireDomainAccess(domain);
    if (denied) return denied;

    const displayDomain = formatDomainFromUrl(domain);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: indicator, error } = await supabaseAdmin
      .from("indicator")
      .select("id, domain, indicator")
      .eq("domain", displayDomain)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch indicator" },
        { status: 500 },
      );
    }

    if (indicator) {
      return NextResponse.json(indicator, { status: 200 });
    }

    const { data: insertedIndicator, error: insertError } = await supabaseAdmin
      .from("indicator")
      .insert([{ domain: displayDomain, indicator: false }])
      .select("id, domain, indicator")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create indicator" },
        { status: 500 },
      );
    }

    return NextResponse.json(insertedIndicator, { status: 200 });
  } catch (error) {
    console.error("Error in get indicator endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> },
) {
  try {
    const { domain } = await params;

    if (!isValidDomain(domain)) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 404 });
    }

    const denied = await requireDomainAccess(domain);
    if (denied) return denied;

    const body = await request.json();
    const indicatorValue = Boolean(body.indicator);
    const isDomainHead = Boolean((await getSession())?.domain);

    // Only the full admin can open recruitment; a domain head can only close it.
    if (indicatorValue && isDomainHead) {
      return NextResponse.json(
        { error: "Only the admin can open recruitment" },
        { status: 403 },
      );
    }
    const displayDomain = formatDomainFromUrl(domain);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingIndicator, error: fetchError } = await supabaseAdmin
      .from("indicator")
      .select("id, indicator")
      .eq("domain", displayDomain)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch indicator" },
        { status: 500 },
      );
    }

    const write = existingIndicator
      ? supabaseAdmin
          .from("indicator")
          .update({ indicator: indicatorValue })
          .eq("domain", displayDomain)
      : supabaseAdmin
          .from("indicator")
          .insert([{ domain: displayDomain, indicator: indicatorValue }]);

    const { data: saved, error: writeError } = await write
      .select("id, domain, indicator")
      .single();

    if (writeError) {
      return NextResponse.json(
        { error: "Failed to update indicator" },
        { status: 500 },
      );
    }

    // A head closing their domain means the team is full: reject (and email)
    // everyone still waiting on it, as a first or a second preference.
    // Admin open/close toggles never do this. Safe to repeat - see the helper.
    let rejected = { first: 0, secondRound: 0, incoming: 0 };
    if (!indicatorValue && isDomainHead) {
      try {
        const result = await rejectOpenCandidates(displayDomain);
        rejected = {
          first: result.first,
          secondRound: result.secondRound,
          incoming: result.incoming,
        };
        sendMailsAfterResponse(result.messages);
      } catch (error) {
        console.error("Failed to reject waiting candidates:", error);
        // Put the domain back so the head can press Close again.
        await supabaseAdmin
          .from("indicator")
          .update({ indicator: true })
          .eq("domain", displayDomain);
        return NextResponse.json(
          {
            error:
              "Couldn't notify the waiting candidates, so recruitment was left open. Please try closing again.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        ...saved,
        rejected,
        rejectedTotal:
          rejected.first + rejected.secondRound + rejected.incoming,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in patch indicator endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
