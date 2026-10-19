import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/** Singleton document (key = "site") holding store-wide configuration. */
const SettingSchema = new Schema(
  {
    key: { type: String, required: true, default: "site" },
    storeName: { type: String, default: "Swarnika" },
    tagline: { type: String, default: "Covering jewellery, crafted to shine" },
    logoText: { type: String, default: "SWARNIKA" },
    announcements: { type: [String], default: [] },
    contact: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      address: { type: String, default: "" },
      hours: { type: String, default: "" },
    },
    social: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
      pinterest: { type: String, default: "" },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 999 },
      flatRate: { type: Number, default: 79 },
      codFee: { type: Number, default: 49 },
      codEnabled: { type: Boolean, default: true },
      estimatedDelivery: { type: String, default: "3–7 business days" },
    },
    policies: {
      shipping: { type: String, default: "" },
      returns: { type: String, default: "" },
      care: { type: String, default: "" },
    },
    seo: {
      defaultTitle: { type: String, default: "" },
      defaultDescription: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

SettingSchema.index({ key: 1 }, { unique: true });

export type SettingDoc = InferSchemaType<typeof SettingSchema> & { _id: Types.ObjectId };

export const Setting: Model<SettingDoc> =
  (models.Setting as Model<SettingDoc>) ?? model<SettingDoc>("Setting", SettingSchema);
