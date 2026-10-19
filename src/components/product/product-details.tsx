"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Gift, RotateCcw, ShieldCheck, Truck, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { PriceDisplay } from "@/components/common/price-display";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { RatingStars } from "@/components/common/rating-stars";
import { useStore } from "@/components/providers/store-provider";
import { formatPrice } from "@/lib/utils";
import type { ProductDTO, SiteSettingsDTO } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";
import { WishlistButton } from "./wishlist-button";

function variantLabel(p: ProductDTO): string {
  if (p.variants.every((v) => v.size && !v.color)) return "Size";
  if (p.variants.every((v) => v.color && !v.size)) return "Finish";
  return "Option";
}

export function ProductDetails({ product, settings }: { product: ProductDTO; settings: SiteSettingsDTO }) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [variantId, setVariantId] = useState<string | null>(product.defaultVariantId);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const variant = product.variants.find((v) => v._id === variantId) ?? null;
  const images = useMemo(() => (variant?.images.length ? variant.images : product.images), [variant, product.images]);
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;
  const stock = variant?.stock ?? product.stock;
  const sku = variant?.sku ?? product.sku;
  const needsVariant = product.variants.length > 0 && !variant;
  const soldOut = stock <= 0;

  const buyNow = async () => {
    setBuying(true);
    const ok = await addToCart(product._id, variantId, qty, { openDrawer: false, silent: true });
    if (ok) router.push("/checkout");
    else setBuying(false);
  };

  const specs: [string, string][] = [
    ["Jewellery type", product.jewelleryType],
    ["Material", product.material],
    ["Plating", product.plating],
    ["Colour", variant?.color || product.color],
    ["Size", variant?.size || product.size],
    ["Weight", product.weight],
    ["SKU", sku],
  ].filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={images} name={product.name} />
        </div>

        <div className="flex flex-col">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            {product.category && (
              <Link href={`/category/${product.category.slug}`} className="eyebrow hover:text-gold-700">
                {product.subcategory?.name ?? product.category.name}
              </Link>
            )}
            <h1 className="mt-3 text-balance text-4xl leading-[1.05] sm:text-5xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {product.reviewCount > 0 ? (
                <a href="#reviews" className="flex items-center gap-2 hover:text-gold-700">
                  <RatingStars value={product.ratings} size={15} />
                  <span className="text-stone">
                    {product.ratings.toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
                  </span>
                </a>
              ) : (
                <a href="#reviews" className="text-stone hover:text-gold-700">Be the first to review</a>
              )}
              {product.salesCount > 10 && <span className="text-stone">· {product.salesCount}+ sold</span>}
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div key={`${price}-${mrp}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <PriceDisplay price={price} mrp={mrp} size="lg" />
                </motion.div>
              </AnimatePresence>
              <p className="mt-1 text-xs text-stone">MRP inclusive of all taxes</p>
            </div>

            {product.shortDescription && <p className="mt-6 text-pretty leading-relaxed text-stone">{product.shortDescription}</p>}
          </motion.div>

          <div className="mt-8 space-y-6 border-t border-border pt-8">
            <VariantSelector
              variants={product.variants}
              value={variantId}
              onChange={(id) => {
                setVariantId(id);
                setQty(1);
              }}
              label={variantLabel(product)}
            />

            <div className="flex items-center gap-2 text-sm">
              <span className={`size-2 rounded-full ${soldOut ? "bg-destructive" : stock <= 5 ? "animate-pulse bg-gold-500" : "bg-emerald-500"}`} />
              <span className={soldOut ? "text-destructive" : stock <= 5 ? "font-medium text-gold-700" : "text-charcoal"}>
                {soldOut ? "Sold out — check back soon" : stock <= 5 ? `Hurry, only ${stock} left` : "In stock · Ready to ship"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(20, stock))} disabled={soldOut} />
              <AddToCartButton
                productId={product._id}
                variantId={variantId}
                quantity={qty}
                disabled={soldOut || needsVariant}
                className="min-w-48 flex-1"
                label={needsVariant ? "Select an option" : "Add to bag"}
              />
              <WishlistButton productId={product._id} name={product.name} variant="outline" size="lg" />
            </div>
            <button
              onClick={buyNow}
              disabled={soldOut || needsVariant || buying}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient text-sm font-semibold tracking-wide text-charcoal shadow-soft transition hover:shadow-lift disabled:opacity-50"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition duration-700 group-hover:translate-x-full" />
              <Zap className="size-4" /> {buying ? "Taking you to checkout…" : "Buy it now"}
            </button>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 text-xs">
            {[
              { icon: Truck, title: settings.shipping.freeShippingThreshold ? `Free shipping over ${formatPrice(settings.shipping.freeShippingThreshold)}` : "Fast shipping", text: settings.shipping.estimatedDelivery },
              { icon: RotateCcw, title: "7-day easy returns", text: "On unused pieces" },
              { icon: ShieldCheck, title: "Anti-tarnish & skin safe", text: "Nickel & lead free" },
              { icon: Gift, title: "Gift-ready packaging", text: "Pouch + box included" },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-2xl border border-border bg-card p-3.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-gold-600" />
                <div>
                  <p className="font-semibold text-charcoal">{title}</p>
                  <p className="mt-0.5 text-stone">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 divide-y divide-border border-y border-border">
            <InfoPanel title="Description" defaultOpen>
              <div className="whitespace-pre-line text-sm leading-relaxed text-stone">{product.description || product.shortDescription}</div>
            </InfoPanel>
            <InfoPanel title="Product details">
              <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-stone">{k}</dt>
                    <dd className="text-charcoal">{v}</dd>
                  </div>
                ))}
                {product.occasion.length > 0 && (
                  <>
                    <dt className="text-stone">Occasion</dt>
                    <dd className="text-charcoal">{product.occasion.join(", ")}</dd>
                  </>
                )}
              </dl>
            </InfoPanel>
            <InfoPanel title="Care instructions">
              <ul className="space-y-2 text-sm text-stone">
                {(product.careInstructions || settings.policies.care).split("\n").filter(Boolean).map((line) => (
                  <li key={line} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold-500" /> {line}
                  </li>
                ))}
              </ul>
            </InfoPanel>
            <InfoPanel title="Shipping information">
              <p className="text-sm leading-relaxed text-stone">{settings.policies.shipping || `Delivered in ${settings.shipping.estimatedDelivery}.`}</p>
            </InfoPanel>
            <InfoPanel title="Returns & exchange">
              <p className="text-sm leading-relaxed text-stone">{settings.policies.returns || "Easy returns within 7 days of delivery."}</p>
            </InfoPanel>
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-ivory/90 p-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-stone">{variant ? variant.name : product.name}</p>
            <p className="font-semibold tabular-nums">{formatPrice(price)}</p>
          </div>
          <AddToCartButton productId={product._id} variantId={variantId} quantity={qty} disabled={soldOut || needsVariant} label={soldOut ? "Sold out" : "Add to bag"} className="h-11 px-6" />
        </div>
      </div>
    </>
  );
}

function InfoPanel({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-5 text-left">
        <span className="font-display text-xl">{title}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }} className="text-2xl font-light leading-none text-gold-600">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
