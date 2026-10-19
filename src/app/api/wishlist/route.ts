import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { getOwner } from "@/lib/auth";
import { wishlistSchema } from "@/lib/validators";
import { addToWishlist, getWishlist } from "@/services/wishlist.service";

export const GET = handler(async () => ok(await getWishlist(await getOwner())));

export const POST = handler(async (req: NextRequest) => {
  const { productId } = await parseJson(req, wishlistSchema);
  return ok(await addToWishlist(await getOwner(true), productId));
});
