import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    /** Smaller rendition used in grids/thumbnails; falls back to `url`. */
    thumbnail: { type: String, default: "" },
    isMain: { type: Boolean, default: false },
  },
  { _id: false },
);

const VariantSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, uppercase: true, trim: true },
  color: { type: String, default: "" },
  size: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  images: { type: [ImageSchema], default: [] },
});

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "", maxlength: 300 },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },

    images: { type: [ImageSchema], default: [] },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },

    sku: { type: String, required: true, uppercase: true, trim: true },
    stock: { type: Number, default: 0, min: 0 },

    material: { type: String, default: "" },
    plating: { type: String, default: "" },
    jewelleryType: { type: String, default: "" },
    occasion: { type: [String], default: [] },
    color: { type: String, default: "" },
    weight: { type: String, default: "" },
    size: { type: String, default: "" },
    careInstructions: { type: String, default: "" },

    variants: { type: [VariantSchema], default: [] },
    tags: { type: [String], default: [] },

    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    ratings: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },

    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

ProductSchema.pre("validate", function () {
  // Keep the denormalised discount in sync with price/MRP.
  const mrp = this.mrp ?? 0;
  const price = this.price ?? 0;
  this.discountPercentage = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  // Total stock mirrors variant stock when variants exist.
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  if (this.images?.length && !this.images.some((i) => i.isMain)) {
    this.images[0].isMain = true;
  }
});

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ "variants.sku": 1 }, { sparse: true });
ProductSchema.index({ category: 1, isActive: 1, createdAt: -1 });
ProductSchema.index({ subcategory: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isActive: 1, salesCount: -1 });
ProductSchema.index({ name: 1 });
ProductSchema.index(
  { name: "text", tags: "text", jewelleryType: "text", material: "text", shortDescription: "text", description: "text" },
  { weights: { name: 10, tags: 6, jewelleryType: 5, material: 2, shortDescription: 2, description: 1 }, name: "product_text" },
);

export type ProductImage = InferSchemaType<typeof ImageSchema>;
export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: Types.ObjectId };

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ?? model<ProductDoc>("Product", ProductSchema);
