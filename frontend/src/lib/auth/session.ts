import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "avyakta-auth";
const SESSION_ALGORITHM = "HS256";
const SESSION_TTL = "7d";

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
  domain: string | null;
};

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "Missing AUTH_SESSION_SECRET environment variable. This is required for session signing and must be set in frontend/.env.local",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(params: {
  userId: string;
  email: string;
  domain?: string | null;
}): Promise<string> {
  const secret = getSessionSecret();

  return new SignJWT({ email: params.email, domain: params.domain ?? null })
    .setProtectedHeader({ alg: SESSION_ALGORITHM })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret);
}

export async function verifySessionId(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecret();

    const { payload } = await jwtVerify(token, secret, {
      algorithms: [SESSION_ALGORITHM],
    });

    if (!payload.sub || typeof payload.email !== "string") {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * True only for the full-admin session (login_credentials.domain === null).
 * A domain head has a valid session too, but must not pass this check —
 * route handlers that gate club-wide content (events, members, recruitment
 * status) should use this, not just "is there a session at all".
 */
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;

    if (!token) {
      return false;
    }

    const session = await verifySessionId(token);
    return session !== null && session.domain === null;
  } catch {
    return false;
  }
}
