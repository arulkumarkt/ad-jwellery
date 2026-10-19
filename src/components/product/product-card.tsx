"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { PriceDisplay } from "@/components/common/price-display";
import { RatingStars } from "@/components/common/rating-stars";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";
import { ProductBadges } from "./product-badges";
import { useQuickView } from "./quick-view";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority = false, className }: { product: ProductCardDTO; priority?: boolean; className?: string }) {
  const { addToCart } = useStore();
  const { open: openQuickView } = useQuickView();
  const [adding, setAdding] = useState(false);
  const soldOut = product.stock <= 0;
  const href = `/product/${product.slug}`;

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasVariants) {
      openQuickView(product.slug);
      return;
    }
    setAdding(true);
    await addToCart(product._id, null, 1);
    setAdding(false);
  };

  return (
    <motion.article
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={cn("group relative flex flex-col", className)}
    >
      <Link href={href} className="relative block overflow-hidden rounded-2xl bg-cream" aria-label={product.name}>
        <motion.div
          variants={{ rest: { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }, hover: { y: -4, boxShadow: "var(--shadow-lift)" } }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] overflow-hidden rounded-2xl"
        >
          {product.image ? (
            <Image
              src={product.image.thumbnail}
              alt={product.image.alt || product.name}
              fill
              priority={priority}
              sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw"
              className={cn(
                "object-cover transition duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.08]",
                product.hoverImage && "group-hover:opacity-0",
                soldOut && "grayscale-[40%]",
              )}
            />
          ) : (
            <div className="grid h-full place-items-center text-stone">No image</div>
          )}
          {product.hoverImage && (
            <Image
              src={product.hoverImage.thumbnail}
              alt=""
              fill
              sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 48vw"
              className="scale-105 object-cover opacity-0 transition duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-100 group-hover:opacity-100"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </motion.div>

        <ProductBadges product={product} discount={product.discountPercentage} soldOut={soldOut} className="absolute left-3 top-3" />

        {/* Desktop hover actions */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 gap-2 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut || adding}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/95 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal shadow-sm backdrop-blur transition hover:bg-charcoal hover:text-ivory disabled:opacity-60"
          >
            <Plus className="size-3.5" />
            {soldOut ? "Sold out" : adding ? "Adding…" : product.hasVariants ? "Choose option" : "Quick add"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openQuickView(product.slug);
            }}
            aria-label={`Quick view ${product.name}`}
            className="grid size-10 place-items-center rounded-full bg-white/95 text-charcoal shadow-sm backdrop-blur transition hover:bg-charcoal hover:text-ivory"
          >
            <Eye className="size-4" />
          </button>
        </div>
      </Link>

      <WishlistButton productId={product._id} name={product.name} size="sm" className="absolute right-3 top-3 z-10" />

      <div className="flex flex-1 flex-col px-1 pt-3.5">
        {product.category && (
          <Link href={`/category/${product.category.slug}`} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-600 hover:text-gold-700">
            {product.category.name}
          </Link>
        )}
        <Link href={href} className="mt-1 line-clamp-2 text-[15px] leading-snug text-charcoal transition hover:text-gold-700">
          {product.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <PriceDisplay price={product.price} mrp={product.mrp} size="sm" showBadge={false} />
          {product.reviewCount > 0 && <RatingStars value={product.ratings} count={product.reviewCount} size={11} />}
        </div>
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut || adding}
          className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-full border border-border text-[11px] font-semibold uppercase tracking-[0.12em] transition active:scale-[0.98] disabled:opacity-50 md:hidden"
        >
          {soldOut ? "Sold out" : adding ? "Adding…" : product.hasVariants ? "Choose option" : "Add to bag"}
        </button>
      </div>
    </motion.article>
  );
}
