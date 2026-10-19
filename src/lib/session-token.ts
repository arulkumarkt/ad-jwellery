/**
 * JWT helpers that run in both the Node runtime and the Proxy runtime.
 * Kept free of `server-only`/mongoose imports so `proxy.ts` can use them.
 */
import { SignJWT, jwtVerify } from "jose";

export const CUSTOMER_COOKIE = "sw_session";
export const ADMIN_COOKIE = "sw_admin";
export const GUEST_COOKIE = "sw_gid";

export const CUSTOMER_SESSION_DAYS = 30;
export const ADMIN_SESSION_HOURS = 12;

export type TokenKind = "customer" | "admin";

export interface SessionClaims {
  sub: string;
  kind: TokenKind;
  name: string;
  email: string;
  role?: string;
  /** Session version; must match the account's current value. */
  v: number;
}

function secretKey(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ kind: claims.kind, name: claims.name, email: claims.email, role: claims.role, v: claims.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .setAudience(claims.kind)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined, kind: TokenKind): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { audience: kind, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || payload.kind !== kind) return null;
    return {
      sub: payload.sub,
      kind,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: typeof payload.role === "string" ? payload.role : undefined,
      v: typeof payload.v === "number" ? payload.v : 0,
    };
  } catch {
    return null;
  }
}
