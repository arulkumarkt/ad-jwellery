import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, default: "footer" },
  },
  { timestamps: true },
);

SubscriberSchema.index({ email: 1 }, { unique: true });

export type SubscriberDoc = InferSchemaType<typeof SubscriberSchema> & { _id: Types.ObjectId };

export const Subscriber: Model<SubscriberDoc> =
  (models.Subscriber as Model<SubscriberDoc>) ?? model<SubscriberDoc>("Subscriber", SubscriberSchema);
