import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { cartAddSchema, cartUpdateSchema } from "@/lib/validators";
import { addToCart, getCart, updateCartItem } from "@/services/cart.service";

export const GET = handler(async (req: NextRequest) => {
  const method = req.nextUrl.searchParams.get("payment") === "cod" ? "cod" : "razorpay";
  return ok(await getCart(await getOwner(), method));
});

/** POST /api/cart — add an item. */
export const POST = handler(async (req: NextRequest) => {
  const input = await parseJson(req, cartAddSchema);
  return ok(await addToCart(await getOwner(true), input));
});

/** PUT /api/cart — change quantity of a line (0 removes it). */
export const PUT = handler(async (req: NextRequest) => {
  const { itemId, quantity } = await parseJson(req, cartUpdateSchema);
  return ok(await updateCartItem(await getOwner(), itemId, quantity));
});
