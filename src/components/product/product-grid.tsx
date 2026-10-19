"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";
import { ProductCard } from "./product-card";

/** Responsive product grid with staggered slide-up reveal. */
export function ProductGrid({
  products,
  className,
  columns = 4,
  priorityCount = 4,
}: {
  products: ProductCardDTO[];
  className?: string;
  columns?: 3 | 4;
  priorityCount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3",
        columns === 4 && "xl:grid-cols-4",
        className,
      )}
    >
      {products.map((p, i) => (
        <motion.div
          key={p._id}
          variants={{ hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
        >
          <ProductCard product={p} priority={i < priorityCount} />
        </motion.div>
      ))}
    </motion.div>
  );
}
