import "server-only";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import { computeCouponDiscount } from "@/lib/pricing";
import { serializeCoupon } from "@/lib/serializers";
import { formatPrice } from "@/lib/utils";
import { Coupon, type CouponDoc } from "@/models";
import type { CouponDTO, Paginated } from "@/types";
import type { z } from "zod";
import type { couponInputSchema } from "@/lib/validators";

export type CouponCheck =
  | { valid: true; code: string; description: string; discount: number }
  | { valid: false; code: string; reason: string };

export function evaluateCoupon(coupon: CouponDoc | null, code: string, subtotal: number, now = new Date()): CouponCheck {
  if (!coupon || !coupon.isActive) return { valid: false, code, reason: "This coupon code is not valid" };
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, code, reason: "This coupon is not active yet" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, code, reason: "This coupon has expired" };
  if (coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
    return { valid: false, code, reason: "This coupon has reached its usage limit" };
  }
  if (subtotal < (coupon.minOrderAmount ?? 0)) {
    return {
      valid: false,
      code,
      reason: `Add ${formatPrice((coupon.minOrderAmount ?? 0) - subtotal)} more to use ${code}`,
    };
  }
  const discount = computeCouponDiscount(
    { type: coupon.type as "percentage" | "fixed", value: coupon.value, maxDiscount: coupon.maxDiscount ?? 0 },
    subtotal,
  );
  const description =
    coupon.description ||
    (coupon.type === "percentage" ? `${coupon.value}% off your order` : `${formatPrice(coupon.value)} off your order`);
  return { valid: true, code, description, discount };
}

export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  await connectDB();
  const normalized = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalized }).lean();
  return evaluateCoupon(coupon, normalized, subtotal);
}

// ─── Admin ───────────────────────────────────────────────────────────

type CouponInput = z.infer<typeof couponInputSchema>;

export async function listCoupons(page = 1, pageSize = 50): Promise<Paginated<CouponDTO>> {
  await connectDB();
  const [docs, total] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Coupon.countDocuments(),
  ]);
  return { items: docs.map(serializeCoupon), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function createCoupon(input: CouponInput): Promise<CouponDTO> {
  await connectDB();
  const doc = await Coupon.create(input);
  return serializeCoupon(doc.toObject());
}

export async function updateCoupon(id: string, input: CouponInput): Promise<CouponDTO> {
  await connectDB();
  const doc = await Coupon.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).lean();
  if (!doc) throw new ApiError("Coupon not found", 404);
  return serializeCoupon(doc);
}

export async function deleteCoupon(id: string): Promise<void> {
  await connectDB();
  const doc = await Coupon.findByIdAndDelete(id);
  if (!doc) throw new ApiError("Coupon not found", 404);
}
