import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { removeCartItem } from "@/services/cart.service";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/cart/:itemId */
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const id = assertObjectId((await params).id);
  return ok(await removeCartItem(await getOwner(), id));
});
