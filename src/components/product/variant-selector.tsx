"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { VariantDTO } from "@/types";

/** Pill selector for product variants (size / colour / finish). */
export function VariantSelector({
  variants,
  value,
  onChange,
  label = "Option",
  layoutId = "variant-pill",
}: {
  variants: VariantDTO[];
  value: string | null;
  onChange: (id: string) => void;
  label?: string;
  layoutId?: string;
}) {
  if (!variants.length) return null;
  const selected = variants.find((v) => v._id === value);
  return (
    <fieldset>
      <legend className="mb-3 flex items-baseline gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone">
        {label}
        {selected && <span className="font-sans text-sm normal-case tracking-normal text-charcoal">{selected.name}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const active = v._id === value;
          const out = v.stock <= 0;
          return (
            <button
              key={v._id}
              type="button"
              onClick={() => onChange(v._id)}
              aria-pressed={active}
              disabled={out}
              className={cn(
                "relative min-w-14 rounded-full border px-4 py-2.5 text-sm transition",
                active ? "border-charcoal text-ivory" : "border-border bg-card text-charcoal hover:border-gold-300",
                out && "cursor-not-allowed text-stone/60 line-through decoration-stone/50",
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full bg-charcoal"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative">{v.size && v.size !== v.name ? v.name : v.name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
