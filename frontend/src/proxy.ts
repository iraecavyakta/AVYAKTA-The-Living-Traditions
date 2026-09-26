import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSessionCookieName } from "./lib/auth/session";
import { formatDomainToUrl } from "./lib/utils/domainFormatter";

const PROTECTED_ROUTES = ["/dashboard", "/domain"];
const ADMIN_ONLY_ROUTES = ["/dashboard"];

type SessionClaims = { domain: string | null } | null;

async function verifySessionToken(token: string): Promise<SessionClaims> {
  try {
    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret) return null;

    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretBytes, {
      algorithms: ["HS256"],
    });
    const domain = typeof payload.domain === "string" ? payload.domain : null;
    return { domain };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(getSessionCookieName())?.value;

  const session = authCookie ? await verifySessionToken(authCookie) : null;
  const isAuthenticated = session !== null;

  // Protected routes - require authentication
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Domain-head accounts (session.domain set) may only reach their own domain page.
    if (session.domain) {
      const ownSlug = formatDomainToUrl(session.domain);

      if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(
          new URL(`/domain/${ownSlug}`, request.url),
        );
      }

      if (pathname.startsWith("/domain")) {
        const requestedSlug = pathname.split("/")[2] ?? "";
        if (requestedSlug && requestedSlug !== ownSlug) {
          return NextResponse.redirect(
            new URL(`/domain/${ownSlug}`, request.url),
          );
        }
      }
    }

    return NextResponse.next();
  }

  // Auth routes - redirect away if already authenticated
  if (pathname === "/auth/login") {
    if (isAuthenticated) {
      const redirectPath = session.domain
        ? `/domain/${formatDomainToUrl(session.domain)}`
        : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/domain",
    "/domain/:path*",
    "/auth/login",
  ],
};
