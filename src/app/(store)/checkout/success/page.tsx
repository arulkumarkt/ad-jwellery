import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Mail, MapPin, Package, Wallet } from "lucide-react";
import { OrderNotFoundState } from "@/components/account/empty-states";
import { AddressBlock, OrderItemsList, OrderTotals, PAYMENT_METHOD_LABEL } from "@/components/account/order-parts";
import { PaymentStatusBadge } from "@/components/account/order-status-badge";
import { RetryPaymentButton } from "@/components/checkout/retry-payment-button";
import { SuccessCelebration } from "@/components/checkout/success-celebration";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { getCustomerSession, getOwner } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/env";
import { readLastOrder } from "@/lib/last-order";
import { cn, formatDate } from "@/lib/utils";
import { getOrderForViewer } from "@/services/order.service";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
  const raw = (await searchParams).order;
  const id = Array.isArray(raw) ? raw[0] : raw;
  const [order, settings, session] = await Promise.all([
    id ? getOrderForViewer(id, await getOwner(), await readLastOrder()) : Promise.resolve(null),
    getSettings(),
    getCustomerSession(),
  ]);

  if (!order) {
    return (
      <div className="container-lux py-10">
        <OrderNotFoundState />
      </div>
    );
  }

  const awaitingPayment =
    order.payment.method === "razorpay" && order.payment.status !== "paid" && order.status !== "cancelled";
  const firstName = order.contact.name.split(" ")[0];

  return (
    <div className="container-lux pb-20 pt-8 sm:pt-14">
      <section className="mx-auto max-w-2xl text-center">
        <SuccessCelebration pending={awaitingPayment} />
        <Reveal delay={0.4}>
          <span className="eyebrow mt-6 block">{awaitingPayment ? "Order saved" : "Order confirmed"}</span>
          <h1 className="mt-3 text-balance text-4xl leading-tight text-charcoal sm:text-5xl">
            {awaitingPayment ? "Payment pending" : `Thank you, ${firstName}!`}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-stone sm:text-base">
            {awaitingPayment
              ? "Your order is reserved but we haven't received the payment yet. Complete it below to confirm your order."
              : `Your order #${order.orderNumber} has been placed. A confirmation is on its way to ${order.contact.email}.`}
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-gold-200 bg-card px-5 py-2.5 shadow-soft">
            <span className="text-xs uppercase tracking-[0.18em] text-stone">Order</span>
            <span className="font-display text-xl font-semibold text-charcoal">#{order.orderNumber}</span>
          </div>
          {awaitingPayment && (
            <div className="mt-6 flex flex-col items-center gap-2">
              {paymentsEnabled() ? (
                <RetryPaymentButton orderId={order._id} orderNumber={order.orderNumber} storeName={settings.storeName} />
              ) : (
                <p className="text-sm text-destructive">Online payment is temporarily unavailable. Please contact us to complete your order.</p>
              )}
              {order.payment.status === "failed" && <p className="text-xs text-destructive">Your last payment attempt failed. No money was deducted.</p>}
            </div>
          )}
        </Reveal>
      </section>

      <Reveal delay={0.55} className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, title: "Confirmation", text: `Sent to ${order.contact.email}` },
          { icon: Package, title: "Packed with care", text: "Gift-ready, tarnish-safe packaging" },
          { icon: CalendarClock, title: "Estimated delivery", text: settings.shipping.estimatedDelivery },
        ].map((b) => (
          <div key={b.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-100">
              <b.icon className="size-[18px]" strokeWidth={1.6} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-charcoal">{b.title}</span>
              <span className="block truncate text-xs text-stone">{b.text}</span>
            </span>
          </div>
        ))}
      </Reveal>

      <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-2xl text-charcoal">Your pieces</h2>
              <span className="text-xs text-stone">{formatDate(order.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <OrderItemsList items={order.items} />
            <div className="mt-6 border-t border-border pt-5">
              <OrderTotals order={order} />
            </div>
          </section>
        </Reveal>
        <div className="flex flex-col gap-6">
          <Reveal>
            <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
              <h2 className="mb-3 flex items-center gap-2 text-xl text-charcoal">
                <MapPin className="size-5 text-gold-600" strokeWidth={1.6} /> Delivering to
              </h2>
              <AddressBlock address={order.shippingAddress} />
            </section>
          </Reveal>
          <Reveal>
            <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
              <h2 className="mb-3 flex items-center gap-2 text-xl text-charcoal">
                <Wallet className="size-5 text-gold-600" strokeWidth={1.6} /> Payment
              </h2>
              <p className="text-sm text-stone">{PAYMENT_METHOD_LABEL[order.payment.method]}</p>
              {order.payment.method === "cod" && order.payment.status === "pending" ? (
                <span className="mt-2 inline-flex rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink">Pay on delivery</span>
              ) : (
                <PaymentStatusBadge status={order.payment.status} className="mt-2" />
              )}
              {order.payment.method === "cod" && <p className="mt-2 text-xs text-stone">Please keep the exact amount ready at delivery.</p>}
            </section>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-3 sm:flex-row sm:justify-center">
        {session && (
          <Link href={`/account/orders/${order._id}`} className={cn(buttonVariants({ variant: "default", size: "xl" }))}>
            View order
          </Link>
        )}
        <Link href="/products" className={cn(buttonVariants({ variant: session ? "outline" : "default", size: "xl" }))}>
          Continue shopping
        </Link>
        {!session && (
          <Link href="/register" className={cn(buttonVariants({ variant: "outline", size: "xl" }))}>
            Create an account to track orders
          </Link>
        )}
      </div>
    </div>
  );
}
