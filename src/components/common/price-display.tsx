import { cn, discountPercent, formatPrice } from "@/lib/utils";

export function PriceDisplay({
  price,
  mrp,
  size = "md",
  showBadge = true,
  className,
}: {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}) {
  const off = mrp ? discountPercent(price, mrp) : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-semibold tracking-tight text-charcoal tabular-nums",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl sm:text-3xl",
        )}
      >
        {formatPrice(price)}
      </span>
      {off > 0 && mrp && (
        <>
          <span className={cn("text-stone line-through tabular-nums", size === "lg" ? "text-base" : "text-xs")}>
            {formatPrice(mrp)}
          </span>
          {showBadge && (
            <span
              className={cn(
                "font-semibold text-gold-600",
                size === "lg" ? "rounded-full bg-gold-50 px-2.5 py-0.5 text-sm" : "text-xs",
              )}
            >
              {off}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}
