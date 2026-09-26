import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../../lib/auth/session";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 },
    );

    // Match the exact attributes used when the cookie was set (path,
    // sameSite, secure) — the browser only clears a cookie when those
    // attributes line up, a bare cookies.delete(name) can silently no-op.
    response.cookies.set(getSessionCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
