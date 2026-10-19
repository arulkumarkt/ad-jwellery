"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/common/modal";
import { PriceDisplay } from "@/components/common/price-display";
import { RatingStars } from "@/components/common/rating-stars";
import { QuantitySelector } from "@/components/common/quantity-selector";
import { api } from "@/lib/fetcher";
import type { ProductDTO } from "@/types";
import { AddToCartButton } from "./add-to-cart-button";
import { VariantSelector } from "./variant-selector";
import { WishlistButton } from "./wishlist-button";

const QuickViewContext = createContext<{ open: (slug: string) => void }>({ open: () => {} });

export function useQuickView() {
  return useContext(QuickViewContext);
}

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const open = useCallback((s: string) => setSlug(s), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <Modal open={Boolean(slug)} onClose={() => setSlug(null)} size="xl" title="Quick view">
        {slug && <QuickViewBody slug={slug} onDone={() => setSlug(null)} />}
      </Modal>
    </QuickViewContext.Provider>
  );
}

function QuickViewBody({ slug, onDone }: { slug: string; onDone: () => void }) {
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    api<ProductDTO>(`/api/products/${encodeURIComponent(slug)}`)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        setVariantId(p.defaultVariantId);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (error) return <p className="p-10 text-center text-sm text-stone">{error}</p>;
  if (!product)
    return (
      <div className="grid h-80 place-items-center">
        <Loader2 className="size-6 animate-spin text-gold-500" />
      </div>
    );

  const variant = product.variants.find((v) => v._id === variantId) ?? null;
  const images = variant?.images.length ? variant.images : product.images;
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;
  const stock = variant?.stock ?? product.stock;
  const current = images[Math.min(imgIndex, images.length - 1)];

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative bg-cream md:rounded-l-3xl">
        <div className="relative aspect-[4/5] overflow-hidden md:rounded-l-3xl">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.url} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <Image src={current.url} alt={current.alt || product.name} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {images.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setImgIndex(i)}
                aria-label={`Show image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-6 bg-charcoal" : "w-1.5 bg-charcoal/30"}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        {product.category && <p className="eyebrow">{product.category.name}</p>}
        <h2 className="text-3xl leading-tight">{product.name}</h2>
        {product.reviewCount > 0 && <RatingStars value={product.ratings} count={product.reviewCount} />}
        <PriceDisplay price={price} mrp={mrp} size="lg" />
        <p className="text-sm leading-relaxed text-stone">{product.shortDescription}</p>
        <VariantSelector
          variants={product.variants}
          value={variantId}
          onChange={(id) => {
            setVariantId(id);
            setImgIndex(0);
            setQty(1);
          }}
          layoutId="qv-variant"
        />
        <p className={`text-xs font-medium ${stock > 0 ? (stock <= 5 ? "text-gold-700" : "text-emerald-700") : "text-destructive"}`}>
          {stock > 0 ? (stock <= 5 ? `Only ${stock} left — order soon` : "In stock, ready to ship") : "Currently sold out"}
        </p>
        <div className="flex items-center gap-3">
          <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, Math.min(20, stock))} disabled={stock <= 0} />
          <AddToCartButton productId={product._id} variantId={variantId} quantity={qty} disabled={stock <= 0} className="flex-1" onAdded={onDone} />
          <WishlistButton productId={product._id} name={product.name} variant="outline" size="lg" />
        </div>
        <Link href={`/product/${product.slug}`} onClick={onDone} className="group mt-auto inline-flex items-center gap-1 text-sm font-medium text-charcoal underline-offset-4 hover:underline">
          View full details <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
