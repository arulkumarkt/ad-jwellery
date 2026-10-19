"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLockBody } from "@/hooks/use-lock-body";
import { EASE } from "@/components/motion";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { useStore } from "@/components/providers/store-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { FreeShippingMeter } from "./free-shipping-meter";

export function CartDrawer() {
  const { cart, cartOpen, closeCart, updateQuantity, removeItem, pendingItemIds } = useStore();
  const pathname = usePathname();
  useLockBody(cartOpen);

  useEffect(() => {
    closeCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, closeCart]);

  const items = cart?.items ?? [];

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Shopping bag">
          <motion.div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory shadow-lift"
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-2xl">Your Bag</h2>
                <p className="text-xs text-stone">{cart?.itemCount ?? 0} item{(cart?.itemCount ?? 0) === 1 ? "" : "s"}</p>
              </div>
              <button onClick={closeCart} aria-label="Close bag" className="grid size-10 place-items-center rounded-full transition hover:rotate-90 hover:bg-cream">
                <X className="size-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                  className="mb-5 grid size-20 place-items-center rounded-full bg-gold-50 ring-1 ring-gold-200"
                >
                  <ShoppingBag className="size-8 text-gold-600" strokeWidth={1.4} />
                </motion.div>
                <p className="font-display text-2xl">Your bag is empty</p>
                <p className="mt-2 text-sm text-stone">Discover pieces that make every day feel special.</p>
                <Link href="/products" className={cn(buttonVariants({ size: "xl" }), "mt-6")} onClick={closeCart}>
                  Start shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="px-6 pt-5">
                  <FreeShippingMeter subtotal={cart!.subtotal - cart!.discount} threshold={cart!.freeShippingThreshold} />
                </div>
                <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item._id}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: pendingItemIds.has(item._id) ? 0.6 : 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="flex gap-4 rounded-2xl bg-card p-3 ring-1 ring-border"
                      >
                        <Link href={`/product/${item.slug}`} className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                          {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-gold-700">
                              {item.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item._id)}
                              aria-label={`Remove ${item.name}`}
                              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-stone transition hover:bg-blush hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          {item.variantLabel && <p className="mt-0.5 text-xs text-stone">{item.variantLabel}</p>}
                          {!item.available && <p className="mt-1 text-xs font-medium text-destructive">Only {item.stock} available</p>}
                          <div className="mt-auto flex items-end justify-between pt-2">
                            <QuantitySelector
                              size="sm"
                              value={item.quantity}
                              max={Math.max(1, Math.min(20, item.stock))}
                              onChange={(q) => updateQuantity(item._id, q)}
                              disabled={pendingItemIds.has(item._id)}
                            />
                            <span className="text-sm font-semibold tabular-nums">{formatPrice(item.lineTotal)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="space-y-3 border-t border-border bg-card px-6 py-5">
                  {cart!.savings > 0 && (
                    <p className="flex justify-between text-xs text-gold-700">
                      <span>You save on MRP</span>
                      <span className="font-semibold tabular-nums">{formatPrice(cart!.savings)}</span>
                    </p>
                  )}
                  <p className="flex items-baseline justify-between">
                    <span className="text-sm text-stone">Subtotal</span>
                    <span className="text-xl font-semibold tabular-nums">{formatPrice(cart!.subtotal)}</span>
                  </p>
                  <p className="text-xs text-stone">Shipping & coupons calculated at checkout.</p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Link href="/cart" className={buttonVariants({ variant: "outline", size: "xl" })}>
                      View bag
                    </Link>
                    <Link href="/checkout" className={cn(buttonVariants({ variant: "default", size: "xl" }), "group")}>
                      Checkout <ArrowRight className="transition group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
