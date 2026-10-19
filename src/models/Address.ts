import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const AddressSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    label: { type: String, default: "Home", maxlength: 30 },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    landmark: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

AddressSchema.index({ customer: 1, isDefault: -1, updatedAt: -1 });

export type AddressDoc = InferSchemaType<typeof AddressSchema> & { _id: Types.ObjectId };

export const Address: Model<AddressDoc> =
  (models.Address as Model<AddressDoc>) ?? model<AddressDoc>("Address", AddressSchema);
