import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { retryWithBackoff } from "../../../lib/api/retry";
import { verifyAdminAuth } from "../../../lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Fetch all members
export async function GET() {
  try {
    const result = await retryWithBackoff(async () =>
      supabase.from("members").select("*"),
    );

    const { data, error } = result;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

// POST - Create a new member
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Admin authentication required",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, domain, role, photo_url, tags, year } = body;

    if (!name || !domain || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("members")
      .insert([{ name, domain, role, photo_url: photo_url || null, tags: Array.isArray(tags) ? tags : [], year: Number.isInteger(year) ? year : null }])
      .select();

    if (error) throw new Error(error.message);

    revalidatePath("/members");

    return NextResponse.json(
      { success: true, data: data?.[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create member" },
      { status: 500 },
    );
  }
}
