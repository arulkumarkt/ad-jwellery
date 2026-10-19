import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: Schema.Types.ObjectId, default: null },
  quantity: { type: Number, required: true, min: 1, max: 20 },
  addedAt: { type: Date, default: Date.now },
});

/** A cart belongs to a logged-in customer or to an anonymous guest cookie id. */
const CartSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    guestId: { type: String, default: null },
    items: { type: [CartItemSchema], default: [] },
    couponCode: { type: String, default: null },
  },
  { timestamps: true },
);

CartSchema.index({ customer: 1 }, { unique: true, partialFilterExpression: { customer: { $type: "objectId" } } });
CartSchema.index({ guestId: 1 }, { unique: true, partialFilterExpression: { guestId: { $type: "string" } } });
// Abandoned guest carts expire after 30 days of inactivity.
CartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { guestId: { $type: "string" } } },
);

export type CartDoc = InferSchemaType<typeof CartSchema> & { _id: Types.ObjectId };

export const Cart: Model<CartDoc> = (models.Cart as Model<CartDoc>) ?? model<CartDoc>("Cart", CartSchema);
