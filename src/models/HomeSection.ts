import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const HOME_SECTION_TYPES = [
  "featured-categories",
  "best-sellers",
  "new-arrivals",
  "featured-products",
  "shop-by-type",
  "promo-banner",
  "why-choose-us",
  "testimonials",
  "social-gallery",
  "newsletter",
] as const;
export type HomeSectionType = (typeof HOME_SECTION_TYPES)[number];

/** Free-form card used by content sections (why-choose-us, testimonials, gallery…). */
const SectionItemSchema = new Schema(
  {
    title: { type: String, default: "" },
    text: { type: String, default: "" },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    href: { type: String, default: "" },
    author: { type: String, default: "" },
    meta: { type: String, default: "" },
    rating: { type: Number, default: 0 },
  },
  { _id: false },
);

const HomeSectionSchema = new Schema(
  {
    type: { type: String, enum: HOME_SECTION_TYPES, required: true },
    eyebrow: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    limit: { type: Number, default: 8, min: 1, max: 24 },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    banner: { type: Schema.Types.ObjectId, ref: "Banner", default: null },
    items: { type: [SectionItemSchema], default: [] },
  },
  { timestamps: true },
);

HomeSectionSchema.index({ isActive: 1, order: 1 });

export type HomeSectionDoc = InferSchemaType<typeof HomeSectionSchema> & { _id: Types.ObjectId };

export const HomeSection: Model<HomeSectionDoc> =
  (models.HomeSection as Model<HomeSectionDoc>) ?? model<HomeSectionDoc>("HomeSection", HomeSectionSchema);
