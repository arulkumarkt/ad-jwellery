import type { Metadata } from "next";
import { WishlistView } from "@/components/cart/wishlist-view";
import { getOwner } from "@/lib/auth";
import { getWishlist } from "@/services/wishlist.service";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const wishlist = await getWishlist(await getOwner());
  return <WishlistView initial={wishlist.products} />;
}
