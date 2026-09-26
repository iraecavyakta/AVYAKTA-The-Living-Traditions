import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";
import {
  createSessionToken,
  getSessionCookieName,
} from "../../../../lib/auth/session";
import { loginSchema } from "../../../../lib/validators/auth";
import { formatDomainToUrl } from "@/lib/utils/domainFormatter";
import { isValidDomainName } from "@/lib/utils/domainValidator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;

    // Use Supabase admin client to verify credentials
    const supabaseAdmin = getSupabaseAdmin();

    // Get user from login_credentials table by email
    const { data: users, error: userError } = await supabaseAdmin
      .from("login_credentials")
      .select("id, email, password_hash, domain")
      .eq("email", email)
      .maybeSingle();

    if (userError || !users) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password hash using bcryptjs
    const isPasswordValid = await bcryptjs.compare(
      password,
      users.password_hash,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const domain =
      typeof users.domain === "string" && isValidDomainName(users.domain)
        ? users.domain
        : null;

    // Create session token
    const token = await createSessionToken({
      userId: users.id,
      email: users.email,
      domain,
    });

    // Admins land straight on the Members page: going via /dashboard adds a
    // server redirect hop, which drops the login scroll transition.
    const redirectTo = domain
      ? `/domain/${formatDomainToUrl(domain)}`
      : "/dashboard/members";

    const response = NextResponse.json(
      { message: "Login successful", redirectTo },
      { status: 200 },
    );

    // Set secure cookie on the outgoing response so the browser persists it.
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login. Please try again." },
      { status: 500 },
    );
  }
}
