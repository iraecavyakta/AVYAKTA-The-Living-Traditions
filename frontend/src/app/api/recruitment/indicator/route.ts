import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { retryWithBackoff } from "../../../../lib/api/retry";
import { verifyAdminAuth } from "../../../../lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Fetch indicator status for all domains
export async function GET() {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await retryWithBackoff(async () =>
      supabase.from("indicator").select("*"),
    );

    const { data, error } = result;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Error fetching indicators:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch indicators" },
      { status: 500 },
    );
  }
}

// PUT - Update global or domain-specific indicator status
export async function PUT(request: NextRequest) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { indicator, domain } = body;

    if (indicator === undefined) {
      return NextResponse.json(
        { success: false, error: "Indicator status is required" },
        { status: 400 },
      );
    }

    let result;

    if (domain) {
      // Update or create domain-specific indicator
      const { data: existing } = await supabase
        .from("indicator")
        .select("id")
        .eq("domain", domain)
        .single();

      if (existing) {
        // Update existing domain indicator
        result = await retryWithBackoff(async () =>
          supabase
            .from("indicator")
            .update({ indicator })
            .eq("domain", domain)
            .select(),
        );
      } else {
        // Insert new domain indicator
        result = await retryWithBackoff(async () =>
          supabase.from("indicator").insert([{ domain, indicator }]).select(),
        );
      }
    } else {
      // Update global indicator (legacy support - uses first record)
      const { data: existing } = await supabase
        .from("indicator")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        // Update existing
        result = await retryWithBackoff(async () =>
          supabase
            .from("indicator")
            .update({ indicator })
            .eq("id", existing.id)
            .select(),
        );
      } else {
        // Insert new (global indicator)
        result = await retryWithBackoff(async () =>
          supabase
            .from("indicator")
            .insert([{ domain: "global", indicator }])
            .select(),
        );
      }
    }

    const { data, error } = result;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error) {
    console.error("Error updating indicator:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update indicator" },
      { status: 500 },
    );
  }
}
