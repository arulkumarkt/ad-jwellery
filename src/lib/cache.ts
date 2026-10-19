import "server-only";
import { revalidateTag } from "next/cache";

export const TAGS = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  home: "home",
  banners: "banners",
  settings: "settings",
  reviews: (productId: string) => `reviews:${productId}`,
} as const;

/** Expire tags immediately so admin edits show on the next storefront request. */
export function invalidate(...tags: string[]) {
  for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 });
}
