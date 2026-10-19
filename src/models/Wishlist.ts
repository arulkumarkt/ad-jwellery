import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const WishlistSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    guestId: { type: String, default: null },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true },
);

WishlistSchema.index({ customer: 1 }, { unique: true, partialFilterExpression: { customer: { $type: "objectId" } } });
WishlistSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: "string" } } });
WishlistSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 60, partialFilterExpression: { guestId: { $type: "string" } } },
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & { _id: Types.ObjectId };

export const Wishlist: Model<WishlistDoc> =
  (models.Wishlist as Model<WishlistDoc>) ?? model<WishlistDoc>("Wishlist", WishlistSchema);
