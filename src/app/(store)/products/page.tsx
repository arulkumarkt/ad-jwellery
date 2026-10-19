import type { Metadata } from "next";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogView } from "@/components/catalog/catalog-view";
import { productQuerySchema } from "@/lib/validators";
import { getCategories } from "@/services/category.service";

type SP = Promise<Record<string, string | string[] | undefined>>;

function flatten(sp: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

const BADGE_TITLES: Record<string, string> = {
  new: "New Arrivals",
  bestseller: "Best Sellers",
  trending: "Trending Now",
  sale: "On Sale",
  featured: "Featured",
};

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = flatten(await searchParams);
  const title = sp.q ? `Search: ${sp.q}` : sp.badge && BADGE_TITLES[sp.badge] ? BADGE_TITLES[sp.badge] : "Shop All Jewellery";
  return {
    title,
    description: "Explore gold-plated covering jewellery — necklaces, jhumkas, bangles, bridal sets and more.",
    alternates: { canonical: "/products" },
    robots: sp.q ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const raw = flatten(await searchParams);
  const filters = productQuerySchema.parse(raw);
  const categories = (await getCategories()).filter((c) => !c.parent);
  const title = filters.q ? `Results for “${filters.q}”` : filters.badge ? BADGE_TITLES[filters.badge] ?? "All Jewellery" : "All Jewellery";

  return (
    <>
      <CatalogHero
        eyebrow={filters.q ? "Search" : "The Collection"}
        title={title}
        description={filters.q ? undefined : "Handpicked covering jewellery in premium plating — for festivals, weddings and every day in between."}
        crumbs={[{ label: "Shop", href: "/products" }, ...(filters.q || filters.badge ? [{ label: title }] : [])]}
      />
      <CatalogView filters={filters} categories={categories} basePath="/products" rawParams={raw} />
    </>
  );
}
