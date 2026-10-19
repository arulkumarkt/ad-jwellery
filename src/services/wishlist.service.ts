import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import type { Owner } from "@/lib/auth";
import { Product, Wishlist } from "@/models";
import { getProductCardsByIds } from "./product.service";
import type { WishlistDTO } from "@/types";

function ownerFilter(owner: Owner) {
  if (owner.customerId) return { customer: new Types.ObjectId(owner.customerId) };
  if (owner.guestId) return { guestId: owner.guestId };
  return null;
}

export async function getWishlist(owner: Owner): Promise<WishlistDTO> {
  const filter = ownerFilter(owner);
  if (!filter) return { productIds: [], products: [] };
  await connectDB();
  const doc = await Wishlist.findOne(filter).lean();
  const ids = (doc?.products ?? []).map(String).reverse();
  const products = await getProductCardsByIds(ids);
  return { productIds: products.map((p) => p._id), products };
}

export async function addToWishlist(owner: Owner, productId: string): Promise<WishlistDTO> {
  const filter = ownerFilter(owner);
  if (!filter) throw new ApiError("Unable to identify your wishlist", 400);
  await connectDB();
  if (!(await Product.exists({ _id: productId, isActive: true }))) throw new ApiError("Product not found", 404);
  await Wishlist.updateOne(
    filter,
    { $addToSet: { products: new Types.ObjectId(productId) }, $setOnInsert: filter },
    { upsert: true },
  );
  return getWishlist(owner);
}

export async function removeFromWishlist(owner: Owner, productId: string): Promise<WishlistDTO> {
  const filter = ownerFilter(owner);
  if (!filter) return { productIds: [], products: [] };
  await connectDB();
  await Wishlist.updateOne(filter, { $pull: { products: new Types.ObjectId(productId) } });
  return getWishlist(owner);
}

export async function mergeGuestWishlist(guestId: string, customerId: string): Promise<void> {
  await connectDB();
  const guest = await Wishlist.findOne({ guestId }).lean();
  if (!guest) return;
  if (guest.products?.length) {
    const customer = new Types.ObjectId(customerId);
    await Wishlist.updateOne(
      { customer },
      { $addToSet: { products: { $each: guest.products } }, $setOnInsert: { customer } },
      { upsert: true },
    );
  }
  await Wishlist.deleteOne({ _id: guest._id });
}
