import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogHero } from "@/components/catalog/catalog-hero";
import { CatalogView } from "@/components/catalog/catalog-view";
import { SubcategoryPills } from "@/components/catalog/catalog-client";
import { productQuerySchema } from "@/lib/validators";
import { getCategories, getCategoryBySlug } from "@/services/category.service";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Category not found" };
  const title = cat.seoTitle || `${cat.name} — Covering Jewellery`;
  const description = cat.seoDescription || cat.description;
  return {
    title,
    description,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title, description, images: cat.bannerImage || cat.image ? [{ url: cat.bannerImage || cat.image }] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const all = await getCategories();
  const parent = cat.parent ? all.find((c) => c._id === cat.parent) ?? null : null;
  const base = parent ? { ...parent, children: all.filter((c) => c.parent === parent._id) } : cat;

  const raw = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  // The path decides the category; a ?subcategory= filter narrows within a parent.
  const filters = productQuerySchema.parse({ ...raw, category: cat.slug });
  if (!cat.parent && raw.subcategory) filters.subcategory = raw.subcategory;

  return (
    <>
      <CatalogHero
        eyebrow={parent ? parent.name : "Collection"}
        title={cat.name}
        description={cat.description}
        image={cat.bannerImage || (parent?.bannerImage ?? undefined)}
        crumbs={[{ label: "Shop", href: "/products" }, ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []), { label: cat.name }]}
      >
        <SubcategoryPills base={base} active={parent ? cat.slug : null} />
      </CatalogHero>
      <CatalogView
        filters={filters}
        categories={all.filter((c) => !c.parent)}
        baseCategory={parent ? null : base}
        basePath={`/category/${cat.slug}`}
        rawParams={raw}
      />
    </>
  );
}
