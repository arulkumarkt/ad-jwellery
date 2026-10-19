import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

const STATUS_STYLES: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "bg-sand/60 text-ink", dot: "bg-stone" },
  confirmed: { label: "Confirmed", className: "bg-gold-50 text-gold-700 ring-gold-200", dot: "bg-gold-500" },
  processing: { label: "Processing", className: "bg-gold-50 text-gold-700 ring-gold-200", dot: "bg-gold-500" },
  shipped: { label: "Shipped", className: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", className: "bg-destructive/5 text-destructive ring-destructive/20", dot: "bg-destructive" },
  returned: { label: "Returned", className: "bg-blush text-ink ring-blush", dot: "bg-stone" },
};

export const ORDER_STATUS_LABEL = (s: OrderStatus) => STATUS_STYLES[s].label;

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ring-transparent",
        s.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

const PAYMENT_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Payment pending", className: "bg-sand/60 text-ink" },
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-800" },
  failed: { label: "Payment failed", className: "bg-destructive/5 text-destructive" },
  refunded: { label: "Refunded", className: "bg-blush text-ink" },
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const s = PAYMENT_STYLES[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", s.className, className)}>
      {s.label}
    </span>
  );
}
