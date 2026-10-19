import { FeaturedCategories } from "@/components/home/featured-categories";
import { HeroSection } from "@/components/home/hero-section";
import { MarqueeBand } from "@/components/home/marquee-band";
import { Newsletter } from "@/components/home/newsletter";
import { ProductCarousel } from "@/components/home/product-carousel";
import { PromotionalBanner } from "@/components/home/promo-banner";
import { ShopByType } from "@/components/home/shop-by-type";
import { SocialGallery } from "@/components/home/social-gallery";
import { Testimonials } from "@/components/home/testimonials";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { JsonLd } from "@/components/common/json-ld";
import { absoluteUrl } from "@/lib/utils";
import { getBanners, getHomeSections } from "@/services/home.service";
import { getSettings } from "@/services/settings.service";
import type { ResolvedHomeSection } from "@/types";

function renderSection(s: ResolvedHomeSection) {
  switch (s.type) {
    case "featured-categories":
      return <FeaturedCategories key={s._id} eyebrow={s.eyebrow} title={s.title || "Shop by category"} subtitle={s.subtitle} categories={s.categories} />;
    case "best-sellers":
      return <ProductCarousel key={s._id} eyebrow={s.eyebrow} title={s.title || "Best Sellers"} subtitle={s.subtitle} products={s.products} viewAllHref="/products?badge=bestseller&sort=best-selling" />;
    case "new-arrivals":
      return <ProductCarousel key={s._id} eyebrow={s.eyebrow} title={s.title || "New Arrivals"} subtitle={s.subtitle} products={s.products} viewAllHref="/products?badge=new&sort=newest" className="bg-cream/40" />;
    case "featured-products":
      return <ProductCarousel key={s._id} eyebrow={s.eyebrow} title={s.title || "Featured"} subtitle={s.subtitle} products={s.products} viewAllHref="/products?badge=featured" />;
    case "shop-by-type":
      return <ShopByType key={s._id} eyebrow={s.eyebrow} title={s.title || "Shop by occasion"} subtitle={s.subtitle} categories={s.categories} />;
    case "promo-banner":
      return s.banner ? <PromotionalBanner key={s._id} banner={s.banner} /> : null;
    case "why-choose-us":
      return <WhyChooseUs key={s._id} eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} items={s.items} />;
    case "testimonials":
      return <Testimonials key={s._id} eyebrow={s.eyebrow} title={s.title} items={s.items} />;
    case "social-gallery":
      return <SocialGallery key={s._id} eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle} items={s.items} />;
    case "newsletter":
      return <Newsletter key={s._id} eyebrow={s.eyebrow} title={s.title || "Join our circle"} subtitle={s.subtitle} />;
    default:
      return null;
  }
}

export default async function HomePage() {
  const [heroes, sections, settings] = await Promise.all([getBanners("hero"), getHomeSections(), getSettings()]);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "JewelryStore",
          name: settings.storeName,
          url: absoluteUrl("/"),
          telephone: settings.contact.phone || undefined,
          email: settings.contact.email || undefined,
          address: settings.contact.address || undefined,
          potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/products")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <HeroSection banners={heroes} />
      <MarqueeBand />
      {sections.map(renderSection)}
    </>
  );
}
