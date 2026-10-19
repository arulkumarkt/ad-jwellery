import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    location: { type: String, default: "", maxlength: 60 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", maxlength: 120 },
    comment: { type: String, required: true, maxlength: 2000 },
    isApproved: { type: Boolean, default: true },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index(
  { product: 1, customer: 1 },
  { unique: true, partialFilterExpression: { customer: { $type: "objectId" } } },
);

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: Types.ObjectId };

export const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) ?? model<ReviewDoc>("Review", ReviewSchema);
