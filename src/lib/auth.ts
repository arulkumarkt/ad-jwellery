import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { connectDB } from "./mongodb";
import { ApiError } from "./api";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_HOURS,
  CUSTOMER_COOKIE,
  CUSTOMER_SESSION_DAYS,
  GUEST_COOKIE,
  signSession,
  verifySession,
} from "./session-token";
import { AdminUser, Customer } from "@/models";
import type { AdminRole, SessionAdmin, SessionCustomer } from "@/types";

const isProd = process.env.NODE_ENV === "production";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Customer sessions ────────────────────────────────────────────────

export async function startCustomerSession(customer: { id: string; name: string; email: string; v: number }) {
  const maxAge = CUSTOMER_SESSION_DAYS * 24 * 60 * 60;
  const token = await signSession(
    { sub: customer.id, kind: "customer", name: customer.name, email: customer.email, v: customer.v },
    maxAge,
  );
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function endCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/** Reads the customer from the signed cookie. Memoised per request. */
export const getCustomerSession = cache(async (): Promise<SessionCustomer | null> => {
  const claims = await verifySession((await cookies()).get(CUSTOMER_COOKIE)?.value, "customer");
  if (!claims) return null;
  return { id: claims.sub, name: claims.name, email: claims.email };
});

/**
 * Like getCustomerSession but also confirms against the database that the
 * account is active and the session has not been revoked.
 */
export const getVerifiedCustomer = cache(async (): Promise<SessionCustomer | null> => {
  const claims = await verifySession((await cookies()).get(CUSTOMER_COOKIE)?.value, "customer");
  if (!claims) return null;
  await connectDB();
  const customer = await Customer.findById(claims.sub).select("name email isActive sessionVersion").lean();
  if (!customer || !customer.isActive || (customer.sessionVersion ?? 0) !== claims.v) return null;
  return { id: String(customer._id), name: customer.name, email: customer.email };
});

export async function requireCustomer(): Promise<SessionCustomer> {
  const customer = await getVerifiedCustomer();
  if (!customer) throw new ApiError("Please sign in to continue", 401);
  return customer;
}

// ─── Admin sessions ───────────────────────────────────────────────────

export async function startAdminSession(admin: { id: string; name: string; email: string; role: AdminRole; v: number }) {
  const maxAge = ADMIN_SESSION_HOURS * 60 * 60;
  const token = await signSession(
    { sub: admin.id, kind: "admin", name: admin.name, email: admin.email, role: admin.role, v: admin.v },
    maxAge,
  );
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

/** Admin sessions are always re-checked against the database. */
export const getAdminSession = cache(async (): Promise<SessionAdmin | null> => {
  const claims = await verifySession((await cookies()).get(ADMIN_COOKIE)?.value, "admin");
  if (!claims) return null;
  await connectDB();
  const admin = await AdminUser.findById(claims.sub).select("name email role isActive sessionVersion").lean();
  if (!admin || !admin.isActive || (admin.sessionVersion ?? 0) !== claims.v) return null;
  return { id: String(admin._id), name: admin.name, email: admin.email, role: admin.role as AdminRole };
});

const ROLE_RANK: Record<AdminRole, number> = { staff: 1, manager: 2, owner: 3 };

export async function requireAdmin(minRole: AdminRole = "staff"): Promise<SessionAdmin> {
  const admin = await getAdminSession();
  if (!admin) throw new ApiError("Admin authentication required", 401);
  if (ROLE_RANK[admin.role] < ROLE_RANK[minRole]) throw new ApiError("You do not have permission for this action", 403);
  return admin;
}

// ─── Cart / wishlist ownership ────────────────────────────────────────

export interface Owner {
  customerId: string | null;
  guestId: string | null;
}

/**
 * Identifies who owns the cart/wishlist for this request. In Route Handlers
 * pass `createGuest` to mint a guest cookie for first-time visitors.
 */
export async function getOwner(createGuest = false): Promise<Owner> {
  const customer = await getCustomerSession();
  if (customer) return { customerId: customer.id, guestId: null };
  const jar = await cookies();
  let guestId = jar.get(GUEST_COOKIE)?.value ?? null;
  if (guestId && !/^[a-f0-9-]{36}$/.test(guestId)) guestId = null;
  if (!guestId && createGuest) {
    guestId = crypto.randomUUID();
    jar.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { customerId: null, guestId };
}

export async function readGuestId(): Promise<string | null> {
  const value = (await cookies()).get(GUEST_COOKIE)?.value ?? null;
  return value && /^[a-f0-9-]{36}$/.test(value) ? value : null;
}
