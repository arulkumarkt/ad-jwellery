import "server-only";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { TAGS, invalidate } from "@/lib/cache";
import { ApiError } from "@/lib/api";
import { serializeBanner, serializeHomeSection } from "@/lib/serializers";
import { Banner, HomeSection } from "@/models";
import { getCategories, getFeaturedCategories } from "./category.service";
import { getProductCardsByIds, getProductCollection } from "./product.service";
import type { BannerDTO, BannerPlacement, HomeSectionDTO, ResolvedHomeSection } from "@/types";
import type { z } from "zod";
import type { bannerInputSchema, homeSectionInputSchema } from "@/lib/validators";

function isLive(b: BannerDTO, now: number) {
  return (!b.startsAt || new Date(b.startsAt).getTime() <= now) && (!b.endsAt || new Date(b.endsAt).getTime() >= now);
}

const loadBanners = unstable_cache(
  async (): Promise<BannerDTO[]> => {
    await connectDB();
    const docs = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    return docs.map(serializeBanner);
  },
  ["banners-active"],
  { tags: [TAGS.banners], revalidate: 600 },
);

export async function getBanners(placement: BannerPlacement): Promise<BannerDTO[]> {
  const now = Date.now();
  return (await loadBanners()).filter((b) => b.placement === placement && isLive(b, now));
}

const loadSections = unstable_cache(
  async (): Promise<HomeSectionDTO[]> => {
    await connectDB();
    const docs = await HomeSection.find({ isActive: true }).sort({ order: 1 }).lean();
    return docs.map(serializeHomeSection);
  },
  ["home-sections"],
  { tags: [TAGS.home], revalidate: 600 },
);

async function resolveSection(s: HomeSectionDTO, promos: BannerDTO[]): Promise<ResolvedHomeSection> {
  const base: ResolvedHomeSection = { ...s, products: [], categories: [], banner: null };
  switch (s.type) {
    case "featured-categories":
    case "shop-by-type": {
      if (s.categoryIds.length) {
        const all = await getCategories();
        const map = new Map(all.map((c) => [c._id, c]));
        base.categories = s.categoryIds.map((id) => map.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
      } else {
        base.categories = await getFeaturedCategories(s.limit);
      }
      return base;
    }
    case "best-sellers":
    case "new-arrivals":
    case "featured-products": {
      base.products = s.productIds.length
        ? await getProductCardsByIds(s.productIds)
        : await getProductCollection(
            s.type === "featured-products" ? "featured" : s.type === "best-sellers" ? "best-sellers" : "new-arrivals",
            s.limit,
          );
      return base;
    }
    case "promo-banner":
      base.banner = promos.find((b) => b._id === s.bannerId) ?? promos[0] ?? null;
      return base;
    default:
      return base;
  }
}

export async function getHomeSections(): Promise<ResolvedHomeSection[]> {
  const [sections, promos] = await Promise.all([loadSections(), getBanners("promo")]);
  return Promise.all(sections.map((s) => resolveSection(s, promos)));
}

// ─── Admin: banners ──────────────────────────────────────────────────

type BannerInput = z.infer<typeof bannerInputSchema>;
type SectionInput = z.infer<typeof homeSectionInputSchema>;

export async function listAllBanners(): Promise<BannerDTO[]> {
  await connectDB();
  const docs = await Banner.find().sort({ placement: 1, order: 1 }).lean();
  return docs.map(serializeBanner);
}

export async function createBanner(input: BannerInput): Promise<BannerDTO> {
  await connectDB();
  const doc = await Banner.create(input);
  invalidate(TAGS.banners, TAGS.home);
  return serializeBanner(doc.toObject());
}

export async function updateBanner(id: string, input: BannerInput): Promise<BannerDTO> {
  await connectDB();
  const doc = await Banner.findByIdAndUpdate(id, input, { returnDocument: "after", runValidators: true }).lean();
  if (!doc) throw new ApiError("Banner not found", 404);
  invalidate(TAGS.banners, TAGS.home);
  return serializeBanner(doc);
}

export async function deleteBanner(id: string): Promise<void> {
  await connectDB();
  const doc = await Banner.findByIdAndDelete(id);
  if (!doc) throw new ApiError("Banner not found", 404);
  await HomeSection.updateMany({ banner: id }, { $set: { banner: null } });
  invalidate(TAGS.banners, TAGS.home);
}

// ─── Admin: home sections ────────────────────────────────────────────

function sectionPayload(input: SectionInput) {
  const { productIds, categoryIds, bannerId, ...rest } = input;
  return { ...rest, products: productIds, categories: categoryIds, banner: bannerId };
}

export async function listAllSections(): Promise<HomeSectionDTO[]> {
  await connectDB();
  const docs = await HomeSection.find().sort({ order: 1 }).lean();
  return docs.map(serializeHomeSection);
}

export async function createSection(input: SectionInput): Promise<HomeSectionDTO> {
  await connectDB();
  const doc = await HomeSection.create(sectionPayload(input));
  invalidate(TAGS.home);
  return serializeHomeSection(doc.toObject());
}

export async function updateSection(id: string, input: SectionInput): Promise<HomeSectionDTO> {
  await connectDB();
  const doc = await HomeSection.findByIdAndUpdate(id, sectionPayload(input), {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) throw new ApiError("Section not found", 404);
  invalidate(TAGS.home);
  return serializeHomeSection(doc);
}

export async function deleteSection(id: string): Promise<void> {
  await connectDB();
  const doc = await HomeSection.findByIdAndDelete(id);
  if (!doc) throw new ApiError("Section not found", 404);
  invalidate(TAGS.home);
}

export async function reorderSections(ids: string[]): Promise<void> {
  await connectDB();
  await HomeSection.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
  invalidate(TAGS.home);
}
