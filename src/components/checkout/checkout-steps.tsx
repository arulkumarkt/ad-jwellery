"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

export const CHECKOUT_STEPS = ["Contact", "Shipping", "Review", "Payment"] as const;

/** Animated progress header. Completed steps are clickable to go back. */
export function CheckoutSteps({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  const progress = current / (CHECKOUT_STEPS.length - 1);
  return (
    <nav aria-label="Checkout progress" className="relative">
      <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[17px] h-px bg-border">
        <motion.div
          className="h-full origin-left bg-gold-gradient"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.6, ease: EASE }}
        />
      </div>
      <ol className="relative grid grid-cols-4">
        {CHECKOUT_STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex justify-center">
              <button
                type="button"
                onClick={() => done && onSelect(i)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className={cn("group flex flex-col items-center gap-2", done ? "cursor-pointer" : "cursor-default")}
              >
                <span
                  className={cn(
                    "relative grid size-9 place-items-center rounded-full border text-sm font-semibold transition-colors duration-300",
                    done && "border-transparent bg-charcoal text-ivory group-hover:bg-gold-700",
                    active && "border-gold-400 bg-card text-gold-700 shadow-soft",
                    !done && !active && "border-border bg-card text-stone/60",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="checkout-step-ring"
                      className="absolute -inset-1 rounded-full ring-2 ring-gold-200"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {done ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <Check className="size-4" strokeWidth={2.4} />
                    </motion.span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-[0.14em] transition-colors sm:text-xs",
                    active ? "text-charcoal" : done ? "text-stone group-hover:text-gold-700" : "text-stone/60",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
