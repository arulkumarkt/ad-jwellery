import { cn } from "@/lib/utils";
import type { ProductBadges as Flags } from "@/types";

export function ProductBadges({
  product,
  discount,
  soldOut,
  className,
}: {
  product: Flags;
  discount: number;
  soldOut?: boolean;
  className?: string;
}) {
  const badges: { label: string; tone: "dark" | "gold" | "light" | "muted" }[] = [];
  if (soldOut) badges.push({ label: "Sold out", tone: "muted" });
  else {
    if (product.isNewArrival) badges.push({ label: "New", tone: "dark" });
    if (product.isBestSeller) badges.push({ label: "Best Seller", tone: "gold" });
    else if (product.isTrending) badges.push({ label: "Trending", tone: "light" });
    if (discount >= 10) badges.push({ label: `${discount}% off`, tone: "light" });
  }
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      {badges.slice(0, 2).map((b) => (
        <span
          key={b.label}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] shadow-sm backdrop-blur",
            b.tone === "dark" && "bg-charcoal/90 text-ivory",
            b.tone === "gold" && "bg-gold-gradient text-charcoal",
            b.tone === "light" && "bg-white/85 text-charcoal",
            b.tone === "muted" && "bg-stone/80 text-white",
          )}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
