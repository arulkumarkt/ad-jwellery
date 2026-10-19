import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { couponInputSchema } from "@/lib/validators";
import { createCoupon, listCoupons } from "@/services/coupon.service";

export const GET = handler(async (req: NextRequest) => {
  await requireAdmin();
  return ok(await listCoupons(Number(req.nextUrl.searchParams.get("page")) || 1));
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  return ok(await createCoupon(await parseJson(req, couponInputSchema)), { status: 201 });
});
