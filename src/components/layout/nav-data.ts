import type { CategoryDTO } from "@/types";

export interface NavLink {
  label: string;
  href: string;
}

export function primaryLinks(categories: CategoryDTO[]): NavLink[] {
  const has = (slug: string) => categories.some((c) => c.slug === slug);
  return [
    { label: "New Arrivals", href: "/products?badge=new" },
    ...(has("necklaces") ? [{ label: "Necklaces", href: "/category/necklaces" }] : []),
    ...(has("earrings") ? [{ label: "Earrings", href: "/category/earrings" }] : []),
    ...(has("bridal-jewellery") ? [{ label: "Bridal", href: "/category/bridal-jewellery" }] : []),
  ];
}
