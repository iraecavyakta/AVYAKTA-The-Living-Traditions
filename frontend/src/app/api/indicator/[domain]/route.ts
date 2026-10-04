import { NextRequest, NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/auth/domainAccess";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
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

    // Only the full admin can open recruitment; a domain head can only close it.
    if (indicatorValue && (await getSession())?.domain) {
      return NextResponse.json(
        { error: "Only the admin can open recruitment" },
        { status: 403 },
      );
    }
    const displayDomain = formatDomainFromUrl(domain);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingIndicator, error: fetchError } = await supabaseAdmin
      .from("indicator")
      .select("id")
      .eq("domain", displayDomain)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch indicator" },
        { status: 500 },
      );
    }

    if (existingIndicator) {
      const { data: updatedIndicator, error: updateError } = await supabaseAdmin
        .from("indicator")
        .update({ indicator: indicatorValue })
        .eq("domain", displayDomain)
        .select("id, domain, indicator")
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update indicator" },
          { status: 500 },
        );
      }

      return NextResponse.json(updatedIndicator, { status: 200 });
    }

    const { data: insertedIndicator, error: insertError } = await supabaseAdmin
      .from("indicator")
      .insert([{ domain: displayDomain, indicator: indicatorValue }])
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
    console.error("Error in patch indicator endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
