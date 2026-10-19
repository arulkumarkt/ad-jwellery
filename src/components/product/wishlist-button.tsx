"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";

/** Heart toggle with a pop + particle burst when saved. */
export function WishlistButton({
  productId,
  name,
  className,
  size = "md",
  variant = "floating",
}: {
  productId: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "floating" | "outline";
}) {
  const { isWishlisted, toggleWishlist } = useStore();
  const active = isWishlisted(productId);
  const dim = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  const icon = size === "lg" ? "size-5" : "size-4";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleWishlist(productId, name);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${name ?? "item"} from wishlist` : `Save ${name ?? "item"} to wishlist`}
      className={cn(
        "relative grid place-items-center rounded-full transition-colors",
        variant === "floating" ? "bg-white/85 shadow-sm backdrop-blur hover:bg-white" : "border border-border bg-card hover:border-gold-300",
        dim,
        className,
      )}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={{ scale: active ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 12 }}
        className="grid place-items-center"
      >
        <Heart className={cn(icon, active ? "fill-gold-500 text-gold-500" : "text-charcoal")} strokeWidth={1.6} />
      </motion.span>
      <AnimatePresence>
        {active && (
          <motion.span key="burst" className="pointer-events-none absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-gold-400"
                  initial={{ x: "-50%", y: "-50%", scale: 0 }}
                  animate={{ x: `calc(-50% + ${Math.cos(angle) * 18}px)`, y: `calc(-50% + ${Math.sin(angle) * 18}px)`, scale: [0, 1, 0] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
