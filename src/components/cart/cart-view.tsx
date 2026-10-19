"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, Loader2, Lock, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { Shimmer } from "@/components/common/skeletons";
import { FreeShippingMeter } from "@/components/layout/free-shipping-meter";
import { EASE } from "@/components/motion";
import { useStore } from "@/components/providers/store-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

export function CartView() {
  const { cart, cartLoading, updateQuantity, removeItem, applyCoupon, toggleWishlist, isWishlisted, pendingItemIds } = useStore();
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);

  if (cartLoading && !cart)
    return (
      <div className="container-lux grid gap-8 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <Shimmer key={i} className="h-36" />)}</div>
        <Shimmer className="h-80" />
      </div>
    );

  if (!cart || cart.items.length === 0)
    return (
      <div className="container-lux py-10">
        <EmptyState icon={ShoppingBag} title="Your bag is empty" description="Looks like you haven't added anything yet. Explore our bestsellers to get started." action={{ label: "Shop bestsellers", href: "/products?badge=bestseller" }} />
      </div>
    );

  const moveToWishlist = async (itemId: string, productId: string, name: string) => {
    if (!isWishlisted(productId)) await toggleWishlist(productId, name);
    await removeItem(itemId);
  };

  const submitCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setApplying(true);
    if (await applyCoupon(code.trim().toUpperCase())) setCode("");
    setApplying(false);
  };

  return (
    <section className="container-lux py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Bag" }]} />
      <h1 className="mt-6 text-4xl sm:text-5xl">
        Your Bag <span className="font-sans text-base text-stone">({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"})</span>
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <FreeShippingMeter subtotal={cart.subtotal - cart.discount} threshold={cart.freeShippingThreshold} />
          <ul className="mt-6 divide-y divide-border border-y border-border">
            <AnimatePresence initial={false}>
              {cart.items.map((item) => (
                <motion.li
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: pendingItemIds.has(item._id) ? 0.6 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex gap-4 py-6 sm:gap-6"
                >
                  <Link href={`/product/${item.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-2xl bg-cream sm:w-32">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="128px" className="object-cover transition duration-500 hover:scale-105" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/product/${item.slug}`} className="line-clamp-2 font-display text-xl leading-tight hover:text-gold-700">
                          {item.name}
                        </Link>
                        {item.variantLabel && <p className="mt-1 text-sm text-stone">Option: {item.variantLabel}</p>}
                        <p className="mt-0.5 text-xs text-stone/80">SKU {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{formatPrice(item.lineTotal)}</p>
                        <p className="text-xs text-stone tabular-nums">
                          {formatPrice(item.price)} each
                          {item.mrp > item.price && <span className="ml-1 line-through">{formatPrice(item.mrp)}</span>}
                        </p>
                      </div>
                    </div>
                    {!item.available && (
                      <p className="mt-2 text-xs font-medium text-destructive">{item.stock > 0 ? `Only ${item.stock} left — reduce quantity to continue` : "Sold out — remove to continue"}</p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <QuantitySelector size="sm" value={item.quantity} max={Math.max(1, Math.min(20, item.stock))} onChange={(q) => updateQuantity(item._id, q)} disabled={pendingItemIds.has(item._id)} />
                      <div className="flex items-center gap-1 text-xs">
                        <button onClick={() => moveToWishlist(item._id, item.productId, item.name)} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-stone transition hover:bg-gold-50 hover:text-charcoal">
                          <Heart className="size-3.5" /> Move to wishlist
                        </button>
                        <button onClick={() => removeItem(item._id)} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-stone transition hover:bg-blush hover:text-destructive">
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <Link href="/products" className="mt-6 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl">Order summary</h2>

            <div className="mt-6">
              {cart.couponCode && !cart.couponError ? (
                <div className="flex items-center justify-between rounded-2xl bg-gold-50 px-4 py-3 ring-1 ring-gold-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="size-4 text-gold-600" />
                    <div>
                      <p className="font-semibold">{cart.couponCode}</p>
                      <p className="text-xs text-stone">{cart.couponDescription}</p>
                    </div>
                  </div>
                  <button onClick={() => applyCoupon(null)} aria-label="Remove coupon" className="grid size-8 place-items-center rounded-full hover:bg-white">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={submitCoupon} className="flex gap-2">
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="h-11 flex-1 rounded-full border border-input bg-ivory px-4 text-sm uppercase outline-none placeholder:normal-case focus:border-gold-400" />
                  <button disabled={applying || !code.trim()} className="h-11 rounded-full bg-charcoal px-5 text-sm font-medium text-ivory disabled:opacity-50">
                    {applying ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                  </button>
                </form>
              )}
              {cart.couponError && <p className="mt-2 text-xs text-destructive">{cart.couponError}</p>}
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd></div>
              {cart.savings > 0 && <div className="flex justify-between text-gold-700"><dt>MRP savings</dt><dd className="tabular-nums">−{formatPrice(cart.savings)}</dd></div>}
              {cart.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Coupon discount</dt><dd className="tabular-nums">−{formatPrice(cart.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone">Shipping</dt><dd className="tabular-nums">{cart.shipping ? formatPrice(cart.shipping) : <span className="font-medium text-emerald-700">Free</span>}</dd></div>
              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <dt className="font-semibold">Total</dt>
                <dd className="text-2xl font-semibold tabular-nums">{formatPrice(cart.total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className={cn(buttonVariants({ size: "xl" }), "group mt-6 w-full", cart.items.some((i) => !i.available) && "pointer-events-none opacity-50")}>
              Proceed to checkout <ArrowRight className="transition group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone"><Lock className="size-3" /> Secure checkout · COD available</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
