"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="rounded-2xl bg-gold-50/70 p-4 ring-1 ring-gold-100">
      <p className="flex items-center gap-2 text-xs text-charcoal">
        <Truck className="size-4 text-gold-600" />
        {remaining > 0 ? (
          <span>
            Add <strong className="font-semibold">{formatPrice(remaining)}</strong> more for <strong>free shipping</strong>
          </span>
        ) : (
          <span className="font-medium">You&apos;ve unlocked free shipping ✨</span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gold-100">
        <motion.div
          className="bg-gold-gradient h-full rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
