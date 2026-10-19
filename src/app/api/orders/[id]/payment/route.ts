import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { readLastOrder } from "@/lib/last-order";
import { retryPayment } from "@/services/order.service";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/orders/:id/payment — start a new online payment attempt for an unpaid order. */
export const POST = handler(async (_req: NextRequest, { params }: Ctx) => {
  const id = assertObjectId((await params).id);
  return ok(await retryPayment(id, await getOwner(), await readLastOrder()));
});
