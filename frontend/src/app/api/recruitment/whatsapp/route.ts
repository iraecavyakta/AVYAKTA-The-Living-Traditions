import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "../../../../lib/auth/session";
import {
  getWhatsAppLink,
  setWhatsAppLink,
} from "../../../../lib/config/recruitmentStatus";

export async function GET() {
  const url = await getWhatsAppLink();
  return NextResponse.json({ url });
}

export async function PATCH(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const url = String(body.url ?? "").trim();

    // Accept empty string (to clear the link) or a valid https:// / http:// URL
    if (url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "URL must start with https:// or http://" },
        { status: 400 },
      );
    }

    await setWhatsAppLink(url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error updating WhatsApp link:", error);
    return NextResponse.json(
      { error: "Failed to update WhatsApp link" },
      { status: 500 },
    );
  }
}
