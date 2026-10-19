/** Pure pricing rules shared by cart, checkout preview and order creation. */
export interface ShippingRules {
  freeShippingThreshold: number;
  flatRate: number;
  codFee: number;
}

export function computeShipping(subtotalAfterDiscount: number, rules: ShippingRules): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= rules.freeShippingThreshold ? 0 : rules.flatRate;
}

export function computeCouponDiscount(
  coupon: { type: "percentage" | "fixed"; value: number; maxDiscount: number },
  subtotal: number,
): number {
  let discount = coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.type === "percentage" && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return Math.max(0, Math.min(Math.round(discount), subtotal));
}
