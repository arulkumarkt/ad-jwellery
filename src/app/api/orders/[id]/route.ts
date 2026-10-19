import type { NextRequest } from "next/server";
import { ApiError, assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { getAdminSession, getOwner, requireAdmin } from "@/lib/auth";
import { readLastOrder } from "@/lib/last-order";
import { orderStatusSchema } from "@/lib/validators";
import { getOrderById, getOrderForViewer, updateOrderStatus } from "@/services/order.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const id = assertObjectId((await params).id);
  if (await getAdminSession()) {
    const order = await getOrderById(id);
    if (!order) throw new ApiError("Order not found", 404);
    return ok(order);
  }
  const order = await getOrderForViewer(id, await getOwner(), await readLastOrder());
  if (!order) throw new ApiError("Order not found", 404);
  return ok(order);
});

/** PATCH /api/orders/:id — admin status / tracking / payment updates. */
export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  const admin = await requireAdmin("staff");
  const id = assertObjectId((await params).id);
  const input = await parseJson(req, orderStatusSchema);
  return ok(await updateOrderStatus(id, input, admin.name));
});
