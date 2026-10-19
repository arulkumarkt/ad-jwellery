import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const BANNER_PLACEMENTS = ["hero", "promo", "strip"] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

const BannerSchema = new Schema(
  {
    placement: { type: String, enum: BANNER_PLACEMENTS, default: "hero" },
    eyebrow: { type: String, default: "" },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    image: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "" },
    secondaryCtaLabel: { type: String, default: "" },
    secondaryCtaHref: { type: String, default: "" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

BannerSchema.index({ placement: 1, isActive: 1, order: 1 });

export type BannerDoc = InferSchemaType<typeof BannerSchema> & { _id: Types.ObjectId };

export const Banner: Model<BannerDoc> =
  (models.Banner as Model<BannerDoc>) ?? model<BannerDoc>("Banner", BannerSchema);
