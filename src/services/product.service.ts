import "server-only";
import { unstable_cache } from "next/cache";
import { Types, type QueryFilter, type SortOrder } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { TAGS, invalidate } from "@/lib/cache";
import { ApiError } from "@/lib/api";
import { serializeProduct, serializeProductCard } from "@/lib/serializers";
import { escapeRegex, slugify } from "@/lib/utils";
import type { ProductInput } from "@/lib/validators";
import { Category, HomeSection, Product, Wishlist, type ProductDoc } from "@/models";
import type {
  CategoryRefDTO,
  FacetsDTO,
  Paginated,
  ProductCardDTO,
  ProductDTO,
  ProductFilters,
  ProductSort,
  SearchSuggestionsDTO,
} from "@/types";

const CARD_FIELDS =
  "name slug price mrp discountPercentage images category ratings reviewCount stock variants._id variants.stock plating isFeatured isBestSeller isNewArrival isTrending";

const SORTS: Record<ProductSort, Record<string, SortOrder>> = {
  featured: { isFeatured: -1, isBestSeller: -1, salesCount: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  "best-selling": { salesCount: -1, createdAt: -1 },
  rating: { ratings: -1, reviewCount: -1 },
};

async function resolveCategoryFilter(slug: string): Promise<QueryFilter<ProductDoc> | null> {
  const cat = await Category.findOne({ slug, isActive: true }).select("_id parent").lean();
  if (!cat) return null;
  return cat.parent ? { subcategory: cat._id } : { category: cat._id };
}

async function buildFilter(filters: ProductFilters): Promise<QueryFilter<ProductDoc> | null> {
  const and: QueryFilter<ProductDoc>[] = [{ isActive: true }];
  if (filters.category) {
    const f = await resolveCategoryFilter(filters.category);
    if (!f) return null;
    and.push(f);
  }
  if (filters.subcategory) {
    const f = await resolveCategoryFilter(filters.subcategory);
    if (!f) return null;
    and.push(f);
  }
  if (filters.q) {
    const rx = new RegExp(escapeRegex(filters.q), "i");
    and.push({ $or: [{ name: rx }, { tags: rx }, { jewelleryType: rx }, { material: rx }, { plating: rx }, { sku: rx }] });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    and.push({
      price: {
        ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
        ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
      },
    });
  }
  if (filters.inStock) and.push({ stock: { $gt: 0 } });
  if (filters.plating) and.push({ plating: new RegExp(`^${escapeRegex(filters.plating)}$`, "i") });
  switch (filters.badge) {
    case "new":
      and.push({ isNewArrival: true });
      break;
    case "bestseller":
      and.push({ isBestSeller: true });
      break;
    case "trending":
      and.push({ isTrending: true });
      break;
    case "featured":
      and.push({ isFeatured: true });
      break;
    case "sale":
      and.push({ discountPercentage: { $gte: 1 } });
      break;
  }
  return and.length === 1 ? and[0] : { $and: and };
}

async function queryProducts(filters: ProductFilters): Promise<Paginated<ProductCardDTO>> {
  await connectDB();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
  const filter = await buildFilter(filters);
  if (!filter) return { items: [], page, pageSize, total: 0, totalPages: 0 };
  const sort = SORTS[filters.sort ?? "featured"] ?? SORTS.featured;
  const [docs, total] = await Promise.all([
    Product.find(filter)
      .select(CARD_FIELDS)
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    items: docs.map((d) => serializeProductCard(d)),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** Cached, tag-invalidated product listing used by pages and `GET /api/products`. */
export const listProducts = unstable_cache(queryProducts, ["products-list"], {
  tags: [TAGS.products],
  revalidate: 600,
});

export const getFacets = unstable_cache(
  async (category?: string): Promise<FacetsDTO> => {
    await connectDB();
    const filter = (await buildFilter({ category })) ?? { _id: null };
    const [range, platings] = await Promise.all([
      Product.aggregate<{ min: number; max: number }>([
        { $match: filter },
        { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
      ]),
      Product.distinct("plating", filter),
    ]);
    return {
      priceRange: { min: Math.floor(range[0]?.min ?? 0), max: Math.ceil(range[0]?.max ?? 0) },
      platings: platings.filter((p): p is string => typeof p === "string" && p.length > 0).sort(),
    };
  },
  ["product-facets"],
  { tags: [TAGS.products], revalidate: 600 },
);

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  return unstable_cache(
    async () => {
      await connectDB();
      const doc = await Product.findOne({ slug, isActive: true })
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .lean();
      return doc ? serializeProduct(doc) : null;
    },
    ["product-by-slug", slug],
    { tags: [TAGS.products, TAGS.product(slug)], revalidate: 600 },
  )();
}

export const getRelatedProducts = unstable_cache(
  async (productId: string, categoryId: string | null, limit = 8): Promise<ProductCardDTO[]> => {
    await connectDB();
    const base = { isActive: true, _id: { $ne: new Types.ObjectId(productId) } };
    const sameCat = categoryId
      ? await Product.find({ ...base, category: categoryId })
          .select(CARD_FIELDS)
          .populate("category", "name slug")
          .sort({ salesCount: -1 })
          .limit(limit)
          .lean()
      : [];
    let docs = sameCat;
    if (docs.length < limit) {
      const fill = await Product.find({ ...base, _id: { $nin: [new Types.ObjectId(productId), ...docs.map((d) => d._id)] } })
        .select(CARD_FIELDS)
        .populate("category", "name slug")
        .sort({ isBestSeller: -1, salesCount: -1 })
        .limit(limit - docs.length)
        .lean();
      docs = [...docs, ...fill];
    }
    return docs.map((d) => serializeProductCard(d));
  },
  ["related-products"],
  { tags: [TAGS.products], revalidate: 600 },
);

/** Products by id, preserving the requested order. Not cached (used for personal lists). */
export async function getProductCardsByIds(ids: string[], activeOnly = true): Promise<ProductCardDTO[]> {
  if (!ids.length) return [];
  await connectDB();
  const docs = await Product.find({ _id: { $in: ids }, ...(activeOnly ? { isActive: true } : {}) })
    .select(CARD_FIELDS)
    .populate("category", "name slug")
    .lean();
  const map = new Map(docs.map((d) => [String(d._id), serializeProductCard(d)]));
  return ids.map((id) => map.get(id)).filter((p): p is ProductCardDTO => Boolean(p));
}

export async function getProductCollection(
  kind: "best-sellers" | "new-arrivals" | "featured" | "trending",
  limit: number,
): Promise<ProductCardDTO[]> {
  const map = {
    "best-sellers": { badge: "bestseller", sort: "best-selling" },
    "new-arrivals": { badge: "new", sort: "newest" },
    featured: { badge: "featured", sort: "featured" },
    trending: { badge: "trending", sort: "best-selling" },
  } as const;
  const res = await listProducts({ badge: map[kind].badge, sort: map[kind].sort, pageSize: limit });
  if (res.items.length >= Math.min(4, limit)) return res.items;
  // Fall back to the general catalogue so a section never renders empty.
  const fallback = await listProducts({ sort: map[kind].sort, pageSize: limit });
  return fallback.items;
}

export const searchSuggestions = unstable_cache(
  async (q: string): Promise<SearchSuggestionsDTO> => {
    await connectDB();
    const term = q.trim().slice(0, 60);
    if (term.length < 2) return { products: [], categories: [], total: 0 };
    const rx = new RegExp(escapeRegex(term), "i");
    const filter = {
      isActive: true,
      $or: [{ name: rx }, { tags: rx }, { jewelleryType: rx }, { plating: rx }],
    };
    const [docs, total, cats] = await Promise.all([
      Product.find(filter).select(CARD_FIELDS).populate("category", "name slug").sort({ salesCount: -1 }).limit(6).lean(),
      Product.countDocuments(filter),
      Category.find({ isActive: true, name: rx }).select("name slug").limit(4).lean(),
    ]);
    return {
      products: docs.map((d) => serializeProductCard(d)),
      categories: cats.map((c): CategoryRefDTO => ({ _id: String(c._id), name: c.name, slug: c.slug })),
      total,
    };
  },
  ["search-suggestions"],
  { tags: [TAGS.products, TAGS.categories], revalidate: 300 },
);

export const getAllProductSlugs = unstable_cache(
  async (): Promise<{ slug: string; updatedAt: string }[]> => {
    await connectDB();
    const docs = await Product.find({ isActive: true }).select("slug updatedAt").lean();
    return docs.map((d) => ({ slug: d.slug, updatedAt: new Date(d.updatedAt ?? Date.now()).toISOString() }));
  },
  ["product-slugs"],
  { tags: [TAGS.products], revalidate: 3600 },
);

// ─── Admin ───────────────────────────────────────────────────────────

export interface AdminProductQuery {
  q?: string;
  category?: string;
  status?: "active" | "inactive" | "low-stock" | "out-of-stock";
  page?: number;
  pageSize?: number;
}

export async function listAdminProducts(query: AdminProductQuery): Promise<Paginated<ProductDTO>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const filter: QueryFilter<ProductDoc> = {};
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: rx }, { sku: rx }, { "variants.sku": rx }, { tags: rx }];
  }
  if (query.category && Types.ObjectId.isValid(query.category)) {
    const id = new Types.ObjectId(query.category);
    filter.$and = [{ $or: [{ category: id }, { subcategory: id }] }];
  }
  if (query.status === "active") filter.isActive = true;
  if (query.status === "inactive") filter.isActive = false;
  if (query.status === "low-stock") filter.stock = { $gt: 0, $lte: 5 };
  if (query.status === "out-of-stock") filter.stock = 0;
  const [docs, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { items: docs.map((d) => serializeProduct(d)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  await connectDB();
  const doc = await Product.findById(id).populate("category", "name slug").populate("subcategory", "name slug").lean();
  return doc ? serializeProduct(doc) : null;
}

async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "product";
  let slug = root;
  for (let i = 2; i < 500; i++) {
    const exists = await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!exists) return slug;
    slug = `${root}-${i}`;
  }
  throw new ApiError("Could not generate a unique slug", 409);
}

async function assertCategories(input: ProductInput) {
  const cat = await Category.findById(input.category).select("parent").lean();
  if (!cat) throw new ApiError("Category not found", 422, { category: "Select a valid category" });
  if (cat.parent) throw new ApiError("Pick a top-level category", 422, { category: "Use the parent category" });
  if (input.subcategory) {
    const sub = await Category.findById(input.subcategory).select("parent").lean();
    if (!sub || String(sub.parent) !== input.category) {
      throw new ApiError("Subcategory must belong to the chosen category", 422, { subcategory: "Invalid subcategory" });
    }
  }
}

function assertUniqueVariantSkus(input: ProductInput) {
  const skus = input.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    throw new ApiError("Variant SKUs must be unique", 422, { variants: "Duplicate variant SKU" });
  }
}

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  await connectDB();
  await assertCategories(input);
  assertUniqueVariantSkus(input);
  const slug = await uniqueProductSlug(input.slug || input.name);
  const doc = await Product.create({ ...input, slug });
  invalidate(TAGS.products, TAGS.home, TAGS.categories);
  return (await getProductById(String(doc._id)))!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductDTO> {
  await connectDB();
  await assertCategories(input);
  assertUniqueVariantSkus(input);
  const doc = await Product.findById(id);
  if (!doc) throw new ApiError("Product not found", 404);
  const previousSlug = doc.slug;
  const slug = await uniqueProductSlug(input.slug || input.name, id);
  doc.set({ ...input, slug });
  await doc.save();
  invalidate(TAGS.products, TAGS.home, TAGS.categories, TAGS.product(previousSlug), TAGS.product(slug));
  return (await getProductById(id))!;
}

export async function deleteProduct(id: string): Promise<void> {
  await connectDB();
  const doc = await Product.findByIdAndDelete(id).select("slug").lean();
  if (!doc) throw new ApiError("Product not found", 404);
  const oid = new Types.ObjectId(id);
  await Promise.all([
    HomeSection.updateMany({}, { $pull: { products: oid } }),
    Wishlist.updateMany({}, { $pull: { products: oid } }),
  ]);
  invalidate(TAGS.products, TAGS.home, TAGS.categories, TAGS.product(doc.slug));
}
