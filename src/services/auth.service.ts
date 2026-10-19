import "server-only";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import {
  endAdminSession,
  endCustomerSession,
  hashPassword,
  readGuestId,
  startAdminSession,
  startCustomerSession,
  verifyPassword,
} from "@/lib/auth";
import { AdminUser, Customer } from "@/models";
import { mergeGuestCart } from "./cart.service";
import { mergeGuestWishlist } from "./wishlist.service";
import type { AdminRole, SessionAdmin, SessionCustomer } from "@/types";

// Compared against when the email is unknown so response time doesn't reveal accounts.
const DUMMY_HASH = "$2b$12$msWOEQe1rBwDLX5CVZStM.xmwffy2NJqpLrV82IMGEP6s0brm3lMi";

async function adoptGuestData(customerId: string) {
  const guestId = await readGuestId();
  if (!guestId) return;
  await Promise.all([mergeGuestCart(guestId, customerId), mergeGuestWishlist(guestId, customerId)]);
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<SessionCustomer> {
  await connectDB();
  if (await Customer.exists({ email: input.email })) {
    throw new ApiError("An account with this email already exists", 409, { email: "Already registered — try signing in" });
  }
  const doc = await Customer.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    lastLoginAt: new Date(),
  });
  const id = String(doc._id);
  await adoptGuestData(id);
  await startCustomerSession({ id, name: doc.name, email: doc.email, v: doc.sessionVersion ?? 0 });
  return { id, name: doc.name, email: doc.email };
}

export async function loginCustomer(input: { email: string; password: string }): Promise<SessionCustomer> {
  await connectDB();
  const doc = await Customer.findOne({ email: input.email }).select("+passwordHash name email isActive sessionVersion");
  const valid = await verifyPassword(input.password, doc?.passwordHash ?? DUMMY_HASH);
  if (!doc || !valid) throw new ApiError("Incorrect email or password", 401);
  if (!doc.isActive) throw new ApiError("This account has been disabled. Please contact support.", 403);
  doc.lastLoginAt = new Date();
  await doc.save();
  const id = String(doc._id);
  await adoptGuestData(id);
  await startCustomerSession({ id, name: doc.name, email: doc.email, v: doc.sessionVersion ?? 0 });
  return { id, name: doc.name, email: doc.email };
}

export async function logoutCustomer() {
  await endCustomerSession();
}

export async function loginAdmin(input: { email: string; password: string }): Promise<SessionAdmin> {
  await connectDB();
  const doc = await AdminUser.findOne({ email: input.email }).select("+passwordHash name email role isActive sessionVersion");
  const valid = await verifyPassword(input.password, doc?.passwordHash ?? DUMMY_HASH);
  if (!doc || !valid || !doc.isActive) throw new ApiError("Incorrect email or password", 401);
  doc.lastLoginAt = new Date();
  await doc.save();
  const admin = { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role as AdminRole };
  await startAdminSession({ ...admin, v: doc.sessionVersion ?? 0 });
  return admin;
}

export async function logoutAdmin() {
  await endAdminSession();
}
