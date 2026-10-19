"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { EASE } from "@/components/motion";
import { cn, formatPrice } from "@/lib/utils";

const intFmt = new Intl.NumberFormat("en-IN");

export function CountUp({ value, currency, className }: { value: number; currency?: boolean; className?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (currency ? formatPrice(v) : intFmt.format(Math.round(v))));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: EASE });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className={cn("tabular-nums", className)}>{text}</motion.span>;
}

export function StatCard({
  label,
  value,
  currency,
  icon: Icon,
  hint,
  tone = "default",
  href,
  index = 0,
}: {
  label: string;
  value: number;
  currency?: boolean;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "gold" | "warning";
  href?: string;
  index?: number;
}) {
  const body = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.06 }}
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
        tone === "gold" ? "border-gold-300/60 bg-charcoal text-ivory" : "border-border bg-white",
      )}
    >
      {tone === "gold" && (
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-gold-gradient opacity-25 blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.2em]",
            tone === "gold" ? "text-gold-200" : "text-stone",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            tone === "gold" && "bg-gold-gradient text-charcoal",
            tone === "warning" && "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
            tone === "default" && "bg-gold-50 text-gold-700 ring-1 ring-gold-200",
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>
      <CountUp
        value={value}
        currency={currency}
        className={cn("relative mt-3 block font-display text-3xl font-semibold leading-none sm:text-[2.1rem]")}
      />
      {hint && (
        <p className={cn("relative mt-2 text-xs", tone === "gold" ? "text-ivory/60" : "text-stone")}>{hint}</p>
      )}
    </motion.div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-gold-400">
      {body}
    </Link>
  ) : (
    body
  );
}
