import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import type { Owner } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/env";
import { createProviderOrder, publicPaymentKey, verifyPaymentSignature } from "@/lib/payment";
import { serializeOrder } from "@/lib/serializers";
import { escapeRegex } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validators";
import { Address, Coupon, Order, Product, nextSequence, type OrderDoc, type OrderStatus } from "@/models";
import { TAGS, invalidate } from "@/lib/cache";
import { clearCart, findCart, priceCart } from "./cart.service";
import { getSettings } from "./settings.service";
import type { CartLineDTO, OrderDTO, Paginated, PaymentStatus } from "@/types";

export interface PaymentInit {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
}

export interface PlaceOrderResult {
  order: OrderDTO;
  payment: PaymentInit | null;
}

type StockLine = Pick<CartLineDTO, "productId" | "variantId" | "quantity">;

/** Atomically decrements stock for each line; rolls back on the first failure. */
async function reserveStock(lines: StockLine[]): Promise<void> {
  const done: StockLine[] = [];
  for (const line of lines) {
    const res = line.variantId
      ? await Product.updateOne(
          {
            _id: line.productId,
            isActive: true,
            variants: { $elemMatch: { _id: new Types.ObjectId(line.variantId), stock: { $gte: line.quantity } } },
          },
          { $inc: { "variants.$.stock": -line.quantity, stock: -line.quantity, salesCount: line.quantity } },
        )
      : await Product.updateOne(
          { _id: line.productId, isActive: true, stock: { $gte: line.quantity } },
          { $inc: { stock: -line.quantity, salesCount: line.quantity } },
        );
    if (res.modifiedCount !== 1) {
      await releaseStock(done);
      throw new ApiError("Some items just went out of stock. Please review your bag.", 409);
    }
    done.push(line);
  }
}

async function releaseStock(lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      await Product.updateOne(
        { _id: line.productId, "variants._id": new Types.ObjectId(line.variantId) },
        { $inc: { "variants.$.stock": line.quantity, stock: line.quantity, salesCount: -line.quantity } },
      );
    } else {
      await Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity, salesCount: -line.quantity } });
    }
  }
}

async function claimCoupon(code: string): Promise<void> {
  const res = await Coupon.updateOne(
    { code, isActive: true, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
    { $inc: { usedCount: 1 } },
  );
  if (res.modifiedCount !== 1) throw new ApiError("This coupon is no longer available", 409);
}

function paymentInit(order: OrderDTO, providerOrderId: string, amountPaise: number): PaymentInit {
  return {
    keyId: publicPaymentKey() ?? "",
    providerOrderId,
    amount: amountPaise,
    currency: "INR",
    name: order.contact.name,
    email: order.contact.email,
    phone: order.contact.phone,
  };
}

export async function placeOrder(owner: Owner, input: CheckoutInput): Promise<PlaceOrderResult> {
  await connectDB();
  const settings = await getSettings();
  if (input.paymentMethod === "razorpay" && !paymentsEnabled()) {
    throw new ApiError("Online payment is unavailable right now. Please choose Cash on Delivery.", 422);
  }
  if (input.paymentMethod === "cod" && !settings.shipping.codEnabled) {
    throw new ApiError("Cash on Delivery is currently unavailable", 422);
  }

  const cart = await findCart(owner);
  const priced = await priceCart(cart, input.paymentMethod);
  if (priced.items.length === 0) throw new ApiError("Your bag is empty", 422);
  const unavailable = priced.items.filter((l) => !l.available);
  if (unavailable.length) {
    throw new ApiError(`${unavailable.map((l) => l.name).join(", ")} ${unavailable.length > 1 ? "are" : "is"} out of stock`, 409);
  }
  if (priced.couponCode && priced.couponError) throw new ApiError(priced.couponError, 422);

  await reserveStock(priced.items);
  try {
    if (priced.couponCode && priced.discount > 0) await claimCoupon(priced.couponCode);
  } catch (err) {
    await releaseStock(priced.items);
    throw err;
  }

  const orderNumber = `SW${100000 + (await nextSequence("order"))}`;
  const isCod = input.paymentMethod === "cod";
  const doc = await Order.create({
    orderNumber,
    customer: owner.customerId ? new Types.ObjectId(owner.customerId) : null,
    contact: input.contact,
    items: priced.items.map((l) => ({
      product: new Types.ObjectId(l.productId),
      variantId: l.variantId ? new Types.ObjectId(l.variantId) : null,
      name: l.name,
      slug: l.slug,
      image: l.image,
      sku: l.sku,
      variantLabel: l.variantLabel,
      price: l.price,
      mrp: l.mrp,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    shippingAddress: input.shippingAddress,
    subtotal: priced.subtotal,
    discount: priced.discount,
    shippingFee: priced.shipping,
    codFee: priced.codFee,
    total: priced.total,
    coupon: { code: priced.discount > 0 ? priced.couponCode : null, discount: priced.discount },
    payment: { method: input.paymentMethod, status: "pending" },
    status: isCod ? "confirmed" : "pending",
    statusHistory: [
      { status: "pending", note: "Order placed" },
      ...(isCod ? [{ status: "confirmed" as const, note: "Cash on Delivery order confirmed" }] : []),
    ],
    notes: input.notes,
    stockReserved: true,
  });

  if (owner.customerId && input.saveAddress) {
    const exists = await Address.exists({
      customer: owner.customerId,
      line1: input.shippingAddress.line1,
      pincode: input.shippingAddress.pincode,
    });
    if (!exists) {
      const count = await Address.countDocuments({ customer: owner.customerId });
      await Address.create({ ...input.shippingAddress, customer: owner.customerId, isDefault: count === 0 });
    }
  }

  await clearCart(owner);
  invalidate(TAGS.products);
  const order = serializeOrder(doc.toObject());

  if (isCod) return { order, payment: null };
  const provider = await createProviderOrder(order.total, order.orderNumber);
  await Order.updateOne({ _id: doc._id }, { $set: { "payment.providerOrderId": provider.id } });
  order.payment.providerOrderId = provider.id;
  return { order, payment: paymentInit(order, provider.id, provider.amount) };
}

/** Starts a fresh payment attempt for an unpaid online order. */
export async function retryPayment(orderId: string, owner: Owner, allowedOrderId: string | null): Promise<PaymentInit> {
  await connectDB();
  const doc = await Order.findById(orderId);
  if (!doc || !canView(doc, owner, allowedOrderId)) throw new ApiError("Order not found", 404);
  if (doc.payment?.method !== "razorpay") throw new ApiError("This order is Cash on Delivery", 422);
  if (doc.payment.status === "paid") throw new ApiError("This order is already paid", 409);
  if (doc.status === "cancelled") throw new ApiError("This order was cancelled", 409);
  const provider = await createProviderOrder(doc.total, doc.orderNumber);
  doc.payment.providerOrderId = provider.id;
  await doc.save();
  return paymentInit(serializeOrder(doc.toObject()), provider.id, provider.amount);
}

export async function confirmPayment(input: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<OrderDTO> {
  await connectDB();
  const doc = await Order.findById(input.orderId);
  if (!doc) throw new ApiError("Order not found", 404);
  if (doc.payment?.providerOrderId !== input.razorpayOrderId) throw new ApiError("Payment does not match this order", 400);
  if (!verifyPaymentSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    doc.payment.status = "failed";
    await doc.save();
    throw new ApiError("Payment verification failed", 400);
  }
  if (doc.payment.status !== "paid") {
    doc.payment.status = "paid";
    doc.payment.providerPaymentId = input.razorpayPaymentId;
    doc.payment.paidAt = new Date();
    if (doc.status === "pending") {
      doc.status = "confirmed";
      doc.statusHistory.push({ status: "confirmed", note: "Payment received", at: new Date() });
    }
    await doc.save();
  }
  return serializeOrder(doc.toObject());
}

function canView(doc: { _id: Types.ObjectId; customer?: Types.ObjectId | null }, owner: Owner, allowedOrderId: string | null) {
  if (owner.customerId && doc.customer && String(doc.customer) === owner.customerId) return true;
  return allowedOrderId === String(doc._id);
}

/** Customer-facing lookup: owners, or the browser that just placed the order. */
export async function getOrderForViewer(id: string, owner: Owner, allowedOrderId: string | null): Promise<OrderDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await Order.findById(id).lean();
  if (!doc || !canView(doc, owner, allowedOrderId)) return null;
  return serializeOrder(doc);
}

export async function listCustomerOrders(customerId: string, page = 1, pageSize = 10): Promise<Paginated<OrderDTO>> {
  await connectDB();
  const filter = { customer: new Types.ObjectId(customerId) };
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);
  return { items: docs.map(serializeOrder), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

// ─── Admin ───────────────────────────────────────────────────────────

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export interface AdminOrderQuery {
  q?: string;
  status?: OrderStatus;
  customer?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(query: AdminOrderQuery): Promise<Paginated<OrderDTO>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const filter: QueryFilter<OrderDoc> = {};
  if (query.status) filter.status = query.status;
  if (query.customer && Types.ObjectId.isValid(query.customer)) filter.customer = new Types.ObjectId(query.customer);
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ orderNumber: rx }, { "contact.name": rx }, { "contact.email": rx }, { "contact.phone": rx }];
  }
  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Order.countDocuments(filter),
  ]);
  return { items: docs.map(serializeOrder), page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export async function getOrderById(id: string): Promise<OrderDTO | null> {
  await connectDB();
  const doc = await Order.findById(id).lean();
  return doc ? serializeOrder(doc) : null;
}

export async function updateOrderStatus(
  id: string,
  input: { status: OrderStatus; note: string; trackingNumber?: string; paymentStatus?: PaymentStatus },
  actor: string,
): Promise<OrderDTO> {
  await connectDB();
  const doc = await Order.findById(id);
  if (!doc) throw new ApiError("Order not found", 404);
  const current = doc.status as OrderStatus;

  if (input.status !== current) {
    if (!ORDER_TRANSITIONS[current].includes(input.status)) {
      throw new ApiError(`Cannot move an order from ${current} to ${input.status}`, 422, { status: "Invalid transition" });
    }
    if ((input.status === "cancelled" || input.status === "returned") && doc.stockReserved) {
      await releaseStock(
        doc.items.map((i) => ({ productId: String(i.product), variantId: i.variantId ? String(i.variantId) : null, quantity: i.quantity })),
      );
      doc.stockReserved = false;
      if (doc.coupon?.code && input.status === "cancelled") {
        await Coupon.updateOne({ code: doc.coupon.code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
      }
      invalidate(TAGS.products);
    }
    doc.status = input.status;
    doc.statusHistory.push({ status: input.status, note: input.note || `Updated by ${actor}`, at: new Date() });
    if (input.status === "delivered" && doc.payment?.method === "cod" && doc.payment.status === "pending") {
      doc.payment.status = "paid";
      doc.payment.paidAt = new Date();
    }
  } else if (input.note) {
    doc.statusHistory.push({ status: current, note: input.note, at: new Date() });
  }
  if (input.trackingNumber !== undefined) doc.trackingNumber = input.trackingNumber;
  if (input.paymentStatus && doc.payment) {
    doc.payment.status = input.paymentStatus;
    if (input.paymentStatus === "paid" && !doc.payment.paidAt) doc.payment.paidAt = new Date();
  }
  await doc.save();
  return serializeOrder(doc.toObject());
}
