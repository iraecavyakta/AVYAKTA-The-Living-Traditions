import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "../../../../lib/auth/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Fetch a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch member" },
      { status: 500 },
    );
  }
}

// PUT - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
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
      .update({
        name,
        domain,
        role,
        photo_url: photo_url || null,
        tags: Array.isArray(tags) ? tags : [],
        year: Number.isInteger(year) ? year : null,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 },
      );
    }

    revalidatePath("/members");

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update member" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/members");

    return NextResponse.json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete member" },
      { status: 500 },
    );
  }
}
