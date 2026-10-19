import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const COUPON_TYPES = ["percentage", "fixed"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 0 },
    /** Caps percentage coupons. 0 = no cap. */
    maxDiscount: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    /** 0 = unlimited */
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

export type CouponDoc = InferSchemaType<typeof CouponSchema> & { _id: Types.ObjectId };

export const Coupon: Model<CouponDoc> =
  (models.Coupon as Model<CouponDoc>) ?? model<CouponDoc>("Coupon", CouponSchema);
