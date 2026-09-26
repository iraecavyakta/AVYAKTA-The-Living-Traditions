import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "../../../lib/auth/session";
import {
  getRecruitmentStatus,
  setRecruitmentStatus,
} from "../../../lib/config/recruitmentStatus";

export async function GET() {
  const isOpen = await getRecruitmentStatus();
  return NextResponse.json({ isOpen });
}

export async function PATCH(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.isOpen !== "boolean") {
      return NextResponse.json(
        { error: "isOpen (boolean) is required" },
        { status: 400 },
      );
    }

    await setRecruitmentStatus(body.isOpen);
    return NextResponse.json({ isOpen: body.isOpen });
  } catch (error) {
    console.error("Error updating recruitment status:", error);
    return NextResponse.json(
      { error: "Failed to update recruitment status" },
      { status: 500 },
    );
  }
}
