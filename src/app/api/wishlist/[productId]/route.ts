import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { removeFromWishlist } from "@/services/wishlist.service";

type Ctx = { params: Promise<{ productId: string }> };

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const id = assertObjectId((await params).productId, "product id");
  return ok(await removeFromWishlist(await getOwner(), id));
});
