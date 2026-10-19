import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    marketingOptIn: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    /** Bumped on password change / logout-everywhere to invalidate older sessions. */
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ name: "text", email: "text", phone: "text" });

export type CustomerDoc = InferSchemaType<typeof CustomerSchema> & { _id: Types.ObjectId };

export const Customer: Model<CustomerDoc> =
  (models.Customer as Model<CustomerDoc>) ?? model<CustomerDoc>("Customer", CustomerSchema);
