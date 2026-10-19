import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cod", "razorpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Order items are snapshots: later product edits never change a placed order. */
const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: "" },
    sku: { type: String, required: true },
    variantLabel: { type: String, default: "" },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: true },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", default: null },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    items: { type: [OrderItemSchema], validate: [(v: unknown[]) => v.length > 0, "Order needs at least one item"] },
    shippingAddress: { type: ShippingAddressSchema, required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    coupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },

    payment: {
      method: { type: String, enum: PAYMENT_METHODS, required: true },
      status: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
      providerOrderId: { type: String, default: null },
      providerPaymentId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, enum: ORDER_STATUSES, required: true },
            note: { type: String, default: "" },
            at: { type: Date, default: Date.now },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    notes: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    /** True once stock has been decremented, so cancellations restock exactly once. */
    stockReserved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "contact.email": 1 });
OrderSchema.index({ "payment.providerOrderId": 1 }, { sparse: true });

export type OrderItemDoc = InferSchemaType<typeof OrderItemSchema> & { _id: Types.ObjectId };
export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: Types.ObjectId };

export const Order: Model<OrderDoc> = (models.Order as Model<OrderDoc>) ?? model<OrderDoc>("Order", OrderSchema);
