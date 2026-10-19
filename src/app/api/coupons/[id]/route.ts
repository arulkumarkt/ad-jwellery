import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { couponInputSchema } from "@/lib/validators";
import { deleteCoupon, updateCoupon } from "@/services/coupon.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  return ok(await updateCoupon(id, await parseJson(req, couponInputSchema)));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteCoupon(assertObjectId((await params).id));
  return ok({ deleted: true });
});
