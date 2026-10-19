import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import type { Owner } from "@/lib/auth";
import { computeShipping } from "@/lib/pricing";
import { Cart, Coupon, Product, type CartDoc, type ProductDoc } from "@/models";
import { evaluateCoupon } from "./coupon.service";
import { getSettings } from "./settings.service";
import type { CartDTO, CartLineDTO, PaymentMethod } from "@/types";

type LeanCart = CartDoc & { _id: Types.ObjectId };
type CartItem = LeanCart["items"][number] & { _id: Types.ObjectId };
type LeanProduct = Pick<
  ProductDoc,
  "name" | "slug" | "images" | "price" | "mrp" | "sku" | "stock" | "variants" | "isActive"
> & { _id: Types.ObjectId };

const MAX_LINE_QTY = 20;

function ownerFilter(owner: Owner): { customer: Types.ObjectId } | { guestId: string } | null {
  if (owner.customerId) return { customer: new Types.ObjectId(owner.customerId) };
  if (owner.guestId) return { guestId: owner.guestId };
  return null;
}

function emptyCart(threshold: number): CartDTO {
  return {
    items: [],
    itemCount: 0,
    subtotal: 0,
    mrpTotal: 0,
    savings: 0,
    discount: 0,
    shipping: 0,
    codFee: 0,
    total: 0,
    couponCode: null,
    couponDescription: null,
    couponError: null,
    freeShippingThreshold: threshold,
  };
}

function variantOf(product: LeanProduct, variantId: Types.ObjectId | string | null | undefined) {
  if (!variantId) return null;
  return (product.variants ?? []).find((v) => String((v as { _id: Types.ObjectId })._id) === String(variantId)) ?? null;
}

function lineFor(item: CartItem, product: LeanProduct): CartLineDTO | null {
  const hasVariants = (product.variants ?? []).length > 0;
  const variant = variantOf(product, item.variantId);
  if (hasVariants && !variant) return null;
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;
  const stock = variant ? (variant.stock ?? 0) : (product.stock ?? 0);
  const images = variant?.images?.length ? variant.images : product.images ?? [];
  const main = images.find((i) => i.isMain) ?? images[0];
  return {
    _id: String(item._id),
    productId: String(product._id),
    variantId: variant ? String((variant as { _id: Types.ObjectId })._id) : null,
    name: product.name,
    slug: product.slug,
    image: main?.thumbnail || main?.url || "",
    variantLabel: variant?.name ?? "",
    sku: variant?.sku ?? product.sku,
    price,
    mrp,
    quantity: item.quantity,
    stock,
    available: product.isActive !== false && stock >= item.quantity,
    lineTotal: price * item.quantity,
  };
}

async function loadProducts(ids: Types.ObjectId[]): Promise<Map<string, LeanProduct>> {
  const docs = await Product.find({ _id: { $in: ids } })
    .select("name slug images price mrp sku stock variants isActive")
    .lean<LeanProduct[]>();
  return new Map(docs.map((d) => [String(d._id), d]));
}

/** Computes a priced cart DTO. All money is calculated server-side from current product data. */
export async function priceCart(cart: LeanCart | null, paymentMethod: PaymentMethod = "razorpay"): Promise<CartDTO> {
  const settings = await getSettings();
  const shippingRules = settings.shipping;
  if (!cart || cart.items.length === 0) return emptyCart(shippingRules.freeShippingThreshold);

  const products = await loadProducts(cart.items.map((i) => i.product as Types.ObjectId));
  const lines: CartLineDTO[] = [];
  for (const item of cart.items as CartItem[]) {
    const product = products.get(String(item.product));
    if (!product || product.isActive === false) continue;
    const line = lineFor(item, product);
    if (line) lines.push(line);
  }

  const available = lines.filter((l) => l.available);
  const subtotal = available.reduce((s, l) => s + l.lineTotal, 0);
  const mrpTotal = available.reduce((s, l) => s + l.mrp * l.quantity, 0);

  let discount = 0;
  let couponDescription: string | null = null;
  let couponError: string | null = null;
  if (cart.couponCode) {
    const coupon = await Coupon.findOne({ code: cart.couponCode }).lean();
    const check = evaluateCoupon(coupon, cart.couponCode, subtotal);
    if (check.valid) {
      discount = check.discount;
      couponDescription = check.description;
    } else couponError = check.reason;
  }

  const shipping = computeShipping(subtotal - discount, shippingRules);
  const codFee = paymentMethod === "cod" && subtotal > 0 ? shippingRules.codFee : 0;
  return {
    items: lines,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    mrpTotal,
    savings: Math.max(0, mrpTotal - subtotal),
    discount,
    shipping,
    codFee,
    total: Math.max(0, subtotal - discount + shipping + codFee),
    couponCode: cart.couponCode ?? null,
    couponDescription,
    couponError,
    freeShippingThreshold: shippingRules.freeShippingThreshold,
  };
}

export async function findCart(owner: Owner): Promise<LeanCart | null> {
  const filter = ownerFilter(owner);
  if (!filter) return null;
  await connectDB();
  return Cart.findOne(filter).lean<LeanCart>();
}

export async function getCart(owner: Owner, paymentMethod?: PaymentMethod): Promise<CartDTO> {
  return priceCart(await findCart(owner), paymentMethod);
}

export async function addToCart(
  owner: Owner,
  input: { productId: string; variantId: string | null; quantity: number },
): Promise<CartDTO> {
  const filter = ownerFilter(owner);
  if (!filter) throw new ApiError("Unable to identify your cart", 400);
  await connectDB();
  const product = await Product.findOne({ _id: input.productId, isActive: true })
    .select("name slug images price mrp sku stock variants isActive")
    .lean<LeanProduct>();
  if (!product) throw new ApiError("This product is no longer available", 404);

  let variantId = input.variantId;
  const hasVariants = (product.variants ?? []).length > 0;
  if (hasVariants) {
    const chosen = variantId
      ? variantOf(product, variantId)
      : (product.variants.find((v) => (v.stock ?? 0) > 0) ?? null);
    if (!chosen) throw new ApiError("Please choose an available option", 422);
    variantId = String((chosen as { _id: Types.ObjectId })._id);
  } else variantId = null;

  const variant = variantOf(product, variantId);
  const stock = variant ? (variant.stock ?? 0) : (product.stock ?? 0);

  const cart = (await Cart.findOne(filter)) ?? new Cart({ ...filter, items: [] });
  const existing = cart.items.find(
    (i) => String(i.product) === input.productId && String(i.variantId ?? "") === String(variantId ?? ""),
  );
  const nextQty = (existing?.quantity ?? 0) + input.quantity;
  if (stock <= 0) throw new ApiError("Sorry, this item just sold out", 409);
  if (nextQty > stock) throw new ApiError(`Only ${stock} left in stock`, 409);
  if (nextQty > MAX_LINE_QTY) throw new ApiError(`You can buy up to ${MAX_LINE_QTY} of an item`, 422);

  if (existing) existing.quantity = nextQty;
  else
    cart.items.push({
      product: product._id,
      variantId: variantId ? new Types.ObjectId(variantId) : null,
      quantity: input.quantity,
    });
  await cart.save();
  return priceCart(cart.toObject() as LeanCart);
}

export async function updateCartItem(owner: Owner, itemId: string, quantity: number): Promise<CartDTO> {
  const filter = ownerFilter(owner);
  if (!filter) throw new ApiError("Cart not found", 404);
  await connectDB();
  const cart = await Cart.findOne(filter);
  if (!cart) throw new ApiError("Cart not found", 404);
  const item = cart.items.id(itemId);
  if (!item) throw new ApiError("Item not found in cart", 404);
  if (quantity <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product).select("stock variants").lean<LeanProduct>();
    const variant = product ? variantOf(product, item.variantId) : null;
    const stock = variant ? (variant.stock ?? 0) : (product?.stock ?? 0);
    if (quantity > stock) throw new ApiError(stock > 0 ? `Only ${stock} left in stock` : "This item is sold out", 409);
    item.quantity = Math.min(quantity, MAX_LINE_QTY);
  }
  await cart.save();
  return priceCart(cart.toObject() as LeanCart);
}

export async function removeCartItem(owner: Owner, itemId: string): Promise<CartDTO> {
  return updateCartItem(owner, itemId, 0);
}

export async function applyCartCoupon(owner: Owner, code: string | null): Promise<CartDTO> {
  const filter = ownerFilter(owner);
  if (!filter) throw new ApiError("Cart not found", 404);
  await connectDB();
  const cart = await Cart.findOne(filter);
  if (!cart || cart.items.length === 0) throw new ApiError("Your bag is empty", 422);
  if (code) {
    const priced = await priceCart({ ...(cart.toObject() as LeanCart), couponCode: null });
    const coupon = await Coupon.findOne({ code }).lean();
    const check = evaluateCoupon(coupon, code, priced.subtotal);
    if (!check.valid) throw new ApiError(check.reason, 422, { code: check.reason });
  }
  cart.couponCode = code;
  await cart.save();
  return priceCart(cart.toObject() as LeanCart);
}

export async function clearCart(owner: Owner): Promise<void> {
  const filter = ownerFilter(owner);
  if (!filter) return;
  await connectDB();
  await Cart.updateOne(filter, { $set: { items: [], couponCode: null } });
}

/** Moves a guest cart into the customer's cart after sign-in. */
export async function mergeGuestCart(guestId: string, customerId: string): Promise<void> {
  await connectDB();
  const guest = await Cart.findOne({ guestId });
  if (!guest || guest.items.length === 0) {
    if (guest) await guest.deleteOne();
    return;
  }
  const customer = new Types.ObjectId(customerId);
  const cart = (await Cart.findOne({ customer })) ?? new Cart({ customer, items: [] });
  for (const gi of guest.items) {
    const match = cart.items.find(
      (i) => String(i.product) === String(gi.product) && String(i.variantId ?? "") === String(gi.variantId ?? ""),
    );
    if (match) match.quantity = Math.min(MAX_LINE_QTY, Math.max(match.quantity, gi.quantity));
    else cart.items.push({ product: gi.product, variantId: gi.variantId, quantity: gi.quantity });
  }
  if (!cart.couponCode && guest.couponCode) cart.couponCode = guest.couponCode;
  await cart.save();
  await guest.deleteOne();
}
