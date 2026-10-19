import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderDTO } from "@/types";
import { ItemThumb } from "./order-parts";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";

/** Summary card linking to an order's detail page. */
export function OrderCard({ order }: { order: OrderDTO }) {
  const shown = order.items.slice(0, 4);
  const extra = order.items.length - shown.length;
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
  const needsPayment = order.payment.method === "razorpay" && order.payment.status !== "paid" && order.status !== "cancelled";
  return (
    <Link
      href={`/account/orders/${order._id}`}
      className="group block rounded-3xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-gold-200 hover:shadow-lift sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone">Order</p>
          <p className="font-display text-2xl text-charcoal">#{order.orderNumber}</p>
          <p className="text-xs text-stone">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <OrderStatusBadge status={order.status} />
          {needsPayment && <PaymentStatusBadge status={order.payment.status} />}
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="flex items-center">
          {shown.map((item, i) => (
            <div key={item._id} className={i > 0 ? "-ml-3" : undefined} style={{ zIndex: shown.length - i }}>
              <ItemThumb src={item.image} alt={item.name} className="size-14 ring-2 ring-card sm:size-16" sizes="64px" />
            </div>
          ))}
          {extra > 0 && (
            <span className="-ml-3 grid size-14 place-items-center rounded-xl bg-cream text-xs font-semibold text-charcoal ring-2 ring-card sm:size-16">
              +{extra}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-stone">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
          <p className="text-lg font-semibold tabular-nums text-charcoal">{formatPrice(order.total)}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
        <span className="text-stone">{order.trackingNumber ? `Tracking · ${order.trackingNumber}` : order.payment.method === "cod" ? "Cash on Delivery" : order.payment.status === "paid" ? "Paid online" : "Online payment"}</span>
        <span className="inline-flex items-center gap-1 font-medium text-charcoal transition group-hover:text-gold-700">
          View details <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
