import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { JsonLd } from "@/components/common/json-ld";
import { ProductCarousel } from "@/components/home/product-carousel";
import { ProductDetails } from "@/components/product/product-details";
import { ReviewsSection } from "@/components/product/reviews-section";
import { absoluteUrl } from "@/lib/utils";
import { getProductBySlug, getRelatedProducts } from "@/services/product.service";
import { getProductReviews } from "@/services/review.service";
import { getSettings } from "@/services/settings.service";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found", robots: { index: false } };
  const title = p.seo.title || p.name;
  const description = p.seo.description || p.shortDescription || p.description.slice(0, 160);
  const og = p.seo.ogImage || p.images[0]?.url;
  return {
    title: { absolute: title.includes("|") ? title : `${title} | Swarnika` },
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title, description, url: absoluteUrl(`/product/${p.slug}`), images: og ? [{ url: og, alt: p.name }] : undefined },
    twitter: { card: "summary_large_image", title, description, images: og ? [og] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [settings, related, reviews] = await Promise.all([
    getSettings(),
    getRelatedProducts(product._id, product.category?._id ?? null, 8),
    getProductReviews(product._id, 1),
  ]);
  const prices = product.variants.length ? product.variants.map((v) => v.price) : [product.price];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription || product.description,
          sku: product.sku,
          image: product.images.map((i) => i.url),
          brand: { "@type": "Brand", name: settings.storeName },
          category: product.category?.name,
          material: product.material || undefined,
          color: product.color || undefined,
          ...(product.reviewCount > 0
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratings, reviewCount: product.reviewCount } }
            : {}),
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: Math.max(1, product.variants.length),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/product/${product.slug}`),
          },
        }}
      />
      <div className="container-lux pb-24 pt-6 lg:pb-0">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Shop", href: "/products" },
            ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
            ...(product.subcategory ? [{ label: product.subcategory.name, href: `/category/${product.subcategory.slug}` }] : []),
            { label: product.name },
          ]}
        />
        <ProductDetails product={product} settings={settings} />
        <div className="mt-16 sm:mt-24">
          <ReviewsSection productId={product._id} productSlug={product.slug} initial={reviews.reviews} summary={reviews.summary} />
        </div>
      </div>
      <ProductCarousel eyebrow="You may also love" title="Complete the look" products={related} viewAllHref={product.category ? `/category/${product.category.slug}` : "/products"} />
    </>
  );
}
