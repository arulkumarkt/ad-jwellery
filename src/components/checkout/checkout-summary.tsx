"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, Truck } from "lucide-react";
import { TotalsRow } from "@/components/account/order-parts";
import { formatPrice } from "@/lib/utils";
import type { CartDTO } from "@/types";

export function CheckoutItems({ cart }: { cart: CartDTO }) {
  return (
    <ul className="flex flex-col gap-4">
      {cart.items.map((item) => (
        <li key={item._id} className="flex items-center gap-3">
          <div className="relative">
            <div className="relative size-16 overflow-hidden rounded-xl bg-cream ring-1 ring-border">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-gold-400">
                  <Gem className="size-5" strokeWidth={1.4} />
                </span>
              )}
            </div>
            <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-charcoal text-[10px] font-semibold text-ivory ring-2 ring-card">
              {item.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm text-charcoal">{item.name}</p>
            {item.variantLabel && <p className="text-xs text-stone">{item.variantLabel}</p>}
            {!item.available && <p className="text-xs font-medium text-destructive">Out of stock</p>}
          </div>
          <p className="text-sm font-medium tabular-nums text-charcoal">{formatPrice(item.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Price breakdown for the selected payment method. */
export function CheckoutTotals({ totals, refreshing }: { totals: CartDTO; refreshing?: boolean }) {
  const toFree = totals.freeShippingThreshold > 0 ? totals.freeShippingThreshold - totals.subtotal : 0;
  return (
    <div className={refreshing ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <dl className="flex flex-col gap-2.5">
        <TotalsRow label={`Subtotal (${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"})`} value={formatPrice(totals.subtotal)} />
        <AnimatePresence initial={false}>
          {totals.discount > 0 && (
            <motion.div key="disc" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <TotalsRow label={`Coupon${totals.couponCode ? ` (${totals.couponCode})` : ""}`} value={`− ${formatPrice(totals.discount)}`} accent />
            </motion.div>
          )}
        </AnimatePresence>
        <TotalsRow label="Shipping" value={totals.shipping > 0 ? formatPrice(totals.shipping) : "Free"} />
        <AnimatePresence initial={false}>
          {totals.codFee > 0 && (
            <motion.div key="cod" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <TotalsRow label="Cash on Delivery fee" value={formatPrice(totals.codFee)} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="hairline mt-1" />
        <TotalsRow label="Total" value={formatPrice(totals.total)} emphasis />
      </dl>
      <p className="mt-1 text-right text-[11px] text-stone">Inclusive of all taxes</p>
      {totals.savings + totals.discount > 0 && (
        <p className="mt-4 rounded-xl bg-gold-50 px-3 py-2 text-center text-xs font-medium text-gold-700 ring-1 ring-gold-100">
          You&apos;re saving {formatPrice(totals.savings + totals.discount)} on this order
        </p>
      )}
      {totals.shipping > 0 && toFree > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-stone">
          <Truck className="size-4 text-gold-600" /> Add {formatPrice(toFree)} more for free shipping
        </p>
      )}
    </div>
  );
}

/** Sticky sidebar summary for desktop. */
export function CheckoutSummary({ cart, totals, refreshing }: { cart: CartDTO; totals: CartDTO; refreshing?: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-2xl text-charcoal">Order summary</h2>
        <span className="text-xs text-stone">{cart.itemCount} items</span>
      </div>
      <div className="max-h-[320px] overflow-y-auto pr-1 pt-2">
        <CheckoutItems cart={cart} />
      </div>
      <div className="my-5 border-t border-border" />
      <CheckoutTotals totals={totals} refreshing={refreshing} />
    </div>
  );
}
