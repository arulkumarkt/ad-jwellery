import "server-only";
import { unstable_cache } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import { TAGS, invalidate } from "@/lib/cache";
import { serializeReview } from "@/lib/serializers";
import { Order, Product, Review } from "@/models";
import type { Paginated, ReviewDTO, ReviewSummaryDTO } from "@/types";

export async function getProductReviews(productId: string, page = 1, pageSize = 6) {
  return unstable_cache(
    async (): Promise<{ reviews: Paginated<ReviewDTO>; summary: ReviewSummaryDTO }> => {
      await connectDB();
      const pid = new Types.ObjectId(productId);
      const filter = { product: pid, isApproved: true };
      const [docs, total, dist] = await Promise.all([
        Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
        Review.countDocuments(filter),
        Review.aggregate<{ _id: number; count: number }>([
          { $match: filter },
          { $group: { _id: "$rating", count: { $sum: 1 } } },
        ]),
      ]);
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummaryDTO["distribution"];
      let sum = 0;
      for (const d of dist) {
        distribution[d._id as 1 | 2 | 3 | 4 | 5] = d.count;
        sum += d._id * d.count;
      }
      return {
        reviews: { items: docs.map(serializeReview), page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        summary: { average: total ? Math.round((sum / total) * 10) / 10 : 0, count: total, distribution },
      };
    },
    ["product-reviews", productId, String(page), String(pageSize)],
    { tags: [TAGS.reviews(productId)], revalidate: 600 },
  )();
}

async function recomputeRating(productId: Types.ObjectId) {
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: productId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const product = await Product.findByIdAndUpdate(
    productId,
    { $set: { ratings: Math.round((agg?.avg ?? 0) * 10) / 10, reviewCount: agg?.count ?? 0 } },
    { returnDocument: "after" },
  )
    .select("slug")
    .lean();
  invalidate(TAGS.reviews(String(productId)), TAGS.products, ...(product ? [TAGS.product(product.slug)] : []));
}

export async function createReview(
  customer: { id: string; name: string },
  productId: string,
  input: { rating: number; title: string; comment: string },
): Promise<ReviewDTO> {
  await connectDB();
  const pid = new Types.ObjectId(productId);
  if (!(await Product.exists({ _id: pid, isActive: true }))) throw new ApiError("Product not found", 404);
  if (await Review.exists({ product: pid, customer: customer.id })) {
    throw new ApiError("You have already reviewed this product", 409);
  }
  const purchased = await Order.exists({
    customer: new Types.ObjectId(customer.id),
    status: "delivered",
    "items.product": pid,
  });
  const doc = await Review.create({
    product: pid,
    customer: customer.id,
    name: customer.name,
    rating: input.rating,
    title: input.title,
    comment: input.comment,
    isVerifiedPurchase: Boolean(purchased),
  });
  await recomputeRating(pid);
  return serializeReview(doc.toObject());
}

// ─── Admin ───────────────────────────────────────────────────────────

export async function listAllReviews(page = 1, pageSize = 30): Promise<Paginated<ReviewDTO & { productName: string }>> {
  await connectDB();
  const [docs, total] = await Promise.all([
    Review.find().sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).populate("product", "name").lean(),
    Review.countDocuments(),
  ]);
  return {
    items: docs.map((d) => {
      const product = d.product as unknown as { _id: Types.ObjectId; name?: string } | null;
      return {
        ...serializeReview({ ...d, product: product?._id ?? (d.product as Types.ObjectId) }),
        productName: product?.name ?? "Deleted product",
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function setReviewApproval(id: string, isApproved: boolean): Promise<void> {
  await connectDB();
  const doc = await Review.findByIdAndUpdate(id, { isApproved }, { returnDocument: "after" }).lean();
  if (!doc) throw new ApiError("Review not found", 404);
  await recomputeRating(doc.product as Types.ObjectId);
}

export async function deleteReview(id: string): Promise<void> {
  await connectDB();
  const doc = await Review.findByIdAndDelete(id).lean();
  if (!doc) throw new ApiError("Review not found", 404);
  await recomputeRating(doc.product as Types.ObjectId);
}
