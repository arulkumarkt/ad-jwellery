import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { couponApplySchema } from "@/lib/validators";
import { applyCartCoupon } from "@/services/cart.service";

/** POST /api/cart/coupon — `{ code }` applies, `{ code: null }` removes. */
export const POST = handler(async (req: NextRequest) => {
  await rateLimit("coupon", 20, 10 * 60 * 1000);
  const { code } = await parseJson(req, couponApplySchema);
  return ok(await applyCartCoupon(await getOwner(), code));
});
