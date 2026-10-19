"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, ShoppingBag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "done";

/** Animated add-to-bag button: idle → spinner → check, then back. */
export function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  disabled,
  className,
  label = "Add to bag",
  openDrawer = true,
  icon = true,
  onAdded,
  children,
}: {
  productId: string;
  variantId: string | null;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  openDrawer?: boolean;
  icon?: boolean;
  onAdded?: () => void;
  children?: ReactNode;
}) {
  const { addToCart } = useStore();
  const [state, setState] = useState<State>("idle");

  const run = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state !== "idle") return;
    setState("loading");
    const ok = await addToCart(productId, variantId, quantity, { openDrawer });
    if (ok) {
      setState("done");
      onAdded?.();
      setTimeout(() => setState("idle"), 1400);
    } else setState("idle");
  };

  return (
    <motion.button
      type="button"
      onClick={run}
      disabled={disabled || state === "loading"}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-charcoal px-7 text-sm font-medium tracking-wide text-ivory transition-colors hover:bg-gold-700 disabled:cursor-not-allowed disabled:bg-stone/40",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "idle" && (
          <motion.span key="idle" className="flex items-center gap-2" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }}>
            {icon && <ShoppingBag className="size-4" />}
            {children ?? label}
          </motion.span>
        )}
        {state === "loading" && (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="size-4 animate-spin" />
          </motion.span>
        )}
        {state === "done" && (
          <motion.span key="done" className="flex items-center gap-2" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
            <Check className="size-4" /> Added
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
