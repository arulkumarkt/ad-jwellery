import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const ADMIN_ROLES = ["owner", "manager", "staff"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Admins live in their own collection so a customer account can never be elevated. */
const AdminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "staff" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AdminUserSchema.index({ email: 1 }, { unique: true });

export type AdminUserDoc = InferSchemaType<typeof AdminUserSchema> & { _id: Types.ObjectId };

export const AdminUser: Model<AdminUserDoc> =
  (models.AdminUser as Model<AdminUserDoc>) ?? model<AdminUserDoc>("AdminUser", AdminUserSchema);
