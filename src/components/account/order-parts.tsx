import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { OrderDTO, OrderItemDTO } from "@/types";
import { ORDER_STATUS_LABEL } from "./order-status-badge";

/** Square product thumbnail with a graceful placeholder. */
export function ItemThumb({ src, alt, className, sizes = "80px" }: { src: string; alt: string; className?: string; sizes?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-border", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-gold-400">
          <Gem className="size-5" strokeWidth={1.4} />
        </span>
      )}
    </div>
  );
}

export function OrderItemsList({ items, linkProducts = true }: { items: OrderItemDTO[]; linkProducts?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item._id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <ItemThumb src={item.image} alt={item.name} className="size-20 sm:size-24" sizes="96px" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:flex-row sm:items-start">
            <div className="min-w-0">
              {linkProducts && item.slug ? (
                <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium text-charcoal transition hover:text-gold-700">
                  {item.name}
                </Link>
              ) : (
                <p className="line-clamp-2 text-sm font-medium text-charcoal">{item.name}</p>
              )}
              {item.variantLabel && <p className="mt-0.5 text-xs text-stone">{item.variantLabel}</p>}
              <p className="mt-1 text-xs text-stone">
                Qty {item.quantity} · {formatPrice(item.price)} each
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-charcoal">{formatPrice(item.lineTotal)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TotalsRow({ label, value, emphasis, accent }: { label: string; value: string; emphasis?: boolean; accent?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", emphasis ? "pt-3 text-base" : "text-sm")}>
      <dt className={emphasis ? "font-medium text-charcoal" : "text-stone"}>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          emphasis ? "font-display text-2xl font-semibold text-charcoal" : "text-charcoal",
          accent && "text-gold-700",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function OrderTotals({ order }: { order: Pick<OrderDTO, "subtotal" | "discount" | "shippingFee" | "codFee" | "total" | "coupon"> }) {
  return (
    <dl className="flex flex-col gap-2.5">
      <TotalsRow label="Subtotal" value={formatPrice(order.subtotal)} />
      {order.discount > 0 && (
        <TotalsRow label={`Coupon${order.coupon.code ? ` (${order.coupon.code})` : ""}`} value={`− ${formatPrice(order.discount)}`} accent />
      )}
      <TotalsRow label="Shipping" value={order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"} />
      {order.codFee > 0 && <TotalsRow label="COD fee" value={formatPrice(order.codFee)} />}
      <div className="hairline mt-1" />
      <TotalsRow label="Total" value={formatPrice(order.total)} emphasis />
    </dl>
  );
}

export function AddressBlock({ address, className }: { address: OrderDTO["shippingAddress"]; className?: string }) {
  return (
    <address className={cn("not-italic text-sm leading-relaxed text-stone", className)}>
      <span className="block font-medium text-charcoal">{address.fullName}</span>
      {address.line1}
      {address.line2 && <>, {address.line2}</>}
      <br />
      {address.landmark && (
        <>
          Near {address.landmark}
          <br />
        </>
      )}
      {address.city}, {address.state} {address.pincode}
      <br />
      {address.country}
      <span className="mt-1 block text-charcoal">{address.phone}</span>
    </address>
  );
}

export function StatusTimeline({ history }: { history: OrderDTO["statusHistory"] }) {
  const entries = [...history].reverse();
  return (
    <ol className="relative flex flex-col gap-5 border-l border-gold-200 pl-6">
      {entries.map((h, i) => (
        <li key={`${h.status}-${h.at}-${i}`} className="relative">
          <span
            className={cn(
              "absolute -left-[29px] top-1 size-2.5 rounded-full ring-4 ring-card",
              i === 0 ? "bg-gold-500" : "bg-gold-200",
            )}
          />
          <p className="text-sm font-medium text-charcoal">{ORDER_STATUS_LABEL(h.status)}</p>
          {h.note && <p className="text-sm text-stone">{h.note}</p>}
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-stone/80">
            {formatDate(h.at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </li>
      ))}
    </ol>
  );
}

export const PAYMENT_METHOD_LABEL = { cod: "Cash on Delivery", razorpay: "Online payment (UPI / Card / Netbanking)" } as const;
