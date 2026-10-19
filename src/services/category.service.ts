import "server-only";
import { unstable_cache } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { TAGS, invalidate } from "@/lib/cache";
import { ApiError } from "@/lib/api";
import { serializeCategory } from "@/lib/serializers";
import { slugify } from "@/lib/utils";
import type { CategoryInput } from "@/lib/validators";
import { Category, HomeSection, Product } from "@/models";
import type { CategoryDTO } from "@/types";

function buildTree(flat: CategoryDTO[]): CategoryDTO[] {
  const byId = new Map(flat.map((c) => [c._id, { ...c, children: [] as CategoryDTO[] }]));
  const roots: CategoryDTO[] = [];
  for (const c of byId.values()) {
    const parent = c.parent ? byId.get(c.parent) : undefined;
    if (parent) parent.children!.push(c);
    else if (!c.parent) roots.push(c);
  }
  const sort = (list: CategoryDTO[]) => {
    list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    list.forEach((c) => c.children && sort(c.children));
  };
  sort(roots);
  return roots;
}

async function loadCategories(includeInactive: boolean): Promise<CategoryDTO[]> {
  await connectDB();
  const [docs, counts] = await Promise.all([
    Category.find(includeInactive ? {} : { isActive: true })
      .sort({ order: 1, name: 1 })
      .lean(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: includeInactive ? {} : { isActive: true } },
      { $project: { cats: { $setUnion: [["$category"], { $cond: [{ $ifNull: ["$subcategory", false] }, ["$subcategory"], []] }] } } },
      { $unwind: "$cats" },
      { $group: { _id: "$cats", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return docs.map((d) => ({ ...serializeCategory(d), productCount: countMap.get(String(d._id)) ?? 0 }));
}

/** Active categories (flat list) with product counts. */
export const getCategories = unstable_cache(() => loadCategories(false), ["categories-active"], {
  tags: [TAGS.categories, TAGS.products],
  revalidate: 3600,
});

export async function getCategoryTree(): Promise<CategoryDTO[]> {
  return buildTree(await getCategories());
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDTO | null> {
  const all = await getCategories();
  const found = all.find((c) => c.slug === slug);
  if (!found) return null;
  return { ...found, children: all.filter((c) => c.parent === found._id) };
}

export async function getFeaturedCategories(limit = 8): Promise<CategoryDTO[]> {
  const all = await getCategories();
  const featured = all.filter((c) => c.isFeatured && !c.parent);
  return (featured.length ? featured : all.filter((c) => !c.parent)).slice(0, limit);
}

// ─── Admin ───────────────────────────────────────────────────────────

export async function listAllCategories(): Promise<CategoryDTO[]> {
  return loadCategories(true);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "category";
  let slug = root;
  for (let i = 2; i < 200; i++) {
    const exists = await Category.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!exists) return slug;
    slug = `${root}-${i}`;
  }
  throw new ApiError("Could not generate a unique slug", 409);
}

async function assertValidParent(parent: string | null, selfId?: string) {
  if (!parent) return;
  if (parent === selfId) throw new ApiError("A category cannot be its own parent", 422, { parent: "Invalid parent" });
  const p = await Category.findById(parent).select("parent").lean();
  if (!p) throw new ApiError("Parent category not found", 422, { parent: "Not found" });
  if (p.parent) throw new ApiError("Subcategories can only be one level deep", 422, { parent: "Choose a top-level category" });
}

export async function createCategory(input: CategoryInput): Promise<CategoryDTO> {
  await connectDB();
  await assertValidParent(input.parent);
  const slug = await uniqueSlug(input.slug || input.name);
  const order = input.order || (await Category.countDocuments({ parent: input.parent }));
  const doc = await Category.create({ ...input, slug, order });
  invalidate(TAGS.categories, TAGS.home);
  return serializeCategory(doc.toObject());
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryDTO> {
  await connectDB();
  await assertValidParent(input.parent, id);
  if (input.parent && (await Category.exists({ parent: id }))) {
    throw new ApiError("This category has subcategories, so it must stay top-level", 422, { parent: "Has children" });
  }
  const slug = await uniqueSlug(input.slug || input.name, id);
  const doc = await Category.findByIdAndUpdate(id, { ...input, slug }, { returnDocument: "after", runValidators: true }).lean();
  if (!doc) throw new ApiError("Category not found", 404);
  invalidate(TAGS.categories, TAGS.products, TAGS.home);
  return serializeCategory(doc);
}

export async function deleteCategory(id: string): Promise<void> {
  await connectDB();
  const [children, products] = await Promise.all([
    Category.countDocuments({ parent: id }),
    Product.countDocuments({ $or: [{ category: id }, { subcategory: id }] }),
  ]);
  if (children) throw new ApiError(`Move or delete its ${children} subcategories first`, 409);
  if (products) throw new ApiError(`${products} products still use this category. Reassign them first.`, 409);
  const res = await Category.findByIdAndDelete(id);
  if (!res) throw new ApiError("Category not found", 404);
  await HomeSection.updateMany({}, { $pull: { categories: new Types.ObjectId(id) } });
  invalidate(TAGS.categories, TAGS.home);
}

export async function reorderCategories(ids: string[]): Promise<void> {
  await connectDB();
  await Category.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
  invalidate(TAGS.categories, TAGS.home);
}
