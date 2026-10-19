"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { EASE } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { useStore } from "@/components/providers/store-provider";
import type { ProductCardDTO } from "@/types";

export function WishlistView({ initial }: { initial: ProductCardDTO[] }) {
  const { wishlistIds } = useStore();
  // Server list gives details; once the client store has loaded, it drives live removals.
  const [synced, setSynced] = useState(false);
  if (!synced && initial.some((p) => wishlistIds.has(p._id))) setSynced(true);
  const visible = synced ? initial.filter((p) => wishlistIds.has(p._id)) : initial;

  return (
    <section className="container-lux py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Wishlist" }]} />
      <div className="mt-6 flex items-end justify-between">
        <h1 className="text-4xl sm:text-5xl">Your Wishlist</h1>
        {visible.length > 0 && <p className="text-sm text-stone">{visible.length} saved</p>}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" description="Tap the heart on any piece to keep it here for later." action={{ label: "Discover jewellery", href: "/products" }} />
      ) : (
        <motion.div layout className="mt-10 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {visible.map((p) => (
              <motion.div key={p._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease: EASE }}>
                <ProductCard product={p} />
                <p className={`mt-1 px-1 text-xs ${p.stock > 0 ? "text-emerald-700" : "text-destructive"}`}>{p.stock > 0 ? "In stock" : "Out of stock"}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}
