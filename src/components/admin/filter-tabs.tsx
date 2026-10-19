"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/** URL-driven pill tabs (`?param=value`), resetting pagination on change. */
export function FilterTabs({
  options,
  param = "status",
  className,
  layoutId = "filter-tabs",
}: {
  options: FilterOption[];
  param?: string;
  className?: string;
  layoutId?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? "";

  function hrefFor(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className={cn("-mx-1 overflow-x-auto px-1 no-scrollbar", className)}>
      <div className="inline-flex gap-1 rounded-full border border-border bg-white p-1 shadow-soft">
        {options.map((o) => {
          const active = o.value === current;
          return (
            <Link
              key={o.value || "all"}
              href={hrefFor(o.value)}
              scroll={false}
              replace
              className={cn(
                "relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium transition-colors",
                active ? "text-ivory" : "text-stone hover:text-charcoal",
              )}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full bg-charcoal"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{o.label}</span>
              {o.count !== undefined && (
                <span
                  className={cn(
                    "relative rounded-full px-1.5 text-[10px] tabular-nums",
                    active ? "bg-gold-400 text-charcoal" : "bg-muted text-stone",
                  )}
                >
                  {o.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
