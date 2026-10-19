import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  processing: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  shipped: "bg-gold-50 text-gold-700 ring-gold-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
  returned: "bg-stone-100 text-stone-700 ring-stone-300",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  refunded: "bg-stone-100 text-stone-700 ring-stone-300",
};

const DOT: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  processing: "bg-indigo-500",
  shipped: "bg-gold-500",
  delivered: "bg-emerald-500",
  cancelled: "bg-rose-500",
  returned: "bg-stone-500",
  paid: "bg-emerald-500",
  failed: "bg-rose-500",
  refunded: "bg-stone-500",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#d97706",
  confirmed: "#0284c7",
  processing: "#4f46e5",
  shipped: "#b48536",
  delivered: "#059669",
  cancelled: "#e11d48",
  returned: "#78716c",
};

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusBadge({
  status,
  kind = "order",
  className,
}: {
  status: OrderStatus | PaymentStatus;
  kind?: "order" | "payment";
  className?: string;
}) {
  const style =
    kind === "payment" ? PAYMENT_STYLES[status as PaymentStatus] : ORDER_STYLES[status as OrderStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        style ?? "bg-muted text-stone ring-border",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status] ?? "bg-stone")} />
      {capitalize(status)}
    </span>
  );
}

type Tone = "neutral" | "gold" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-stone ring-border",
  gold: "bg-gold-50 text-gold-700 ring-gold-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-rose-50 text-rose-800 ring-rose-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
};

/** Small pill for generic states (active/inactive, low stock, etc). */
export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
