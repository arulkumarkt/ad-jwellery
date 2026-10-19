import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/**
 * Categories are self-referencing: a category with a `parent` is a subcategory.
 * This keeps one collection, one admin screen and simple tree queries.
 */
const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "", maxlength: 600 },
    image: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true },
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1, order: 1 });
CategorySchema.index({ isActive: 1, isFeatured: 1, order: 1 });

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: Types.ObjectId };

export const Category: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ?? model<CategoryDoc>("Category", CategorySchema);
