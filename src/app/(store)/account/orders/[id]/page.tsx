import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, Package, Truck } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/account/order-status-badge";
import { OrderTracker } from "@/components/account/order-tracker";
import { AddressBlock, OrderItemsList, OrderTotals, PAYMENT_METHOD_LABEL, StatusTimeline } from "@/components/account/order-parts";
import { RetryPaymentButton } from "@/components/checkout/retry-payment-button";
import { Reveal } from "@/components/motion";
import { getVerifiedCustomer } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { getOrderForViewer } from "@/services/order.service";
import { getSettings } from "@/services/settings.service";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await getVerifiedCustomer();
  const order = customer ? await getOrderForViewer(id, { customerId: customer.id, guestId: null }, null) : null;
  return { title: order ? `Order #${order.orderNumber}` : "Order", robots: { index: false, follow: false } };
}

function Card({ title, icon: Icon, children, className }: { title: string; icon: typeof Package; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7 ${className ?? ""}`}>
      <h2 className="mb-4 flex items-center gap-2 text-xl text-charcoal sm:text-2xl">
        <Icon className="size-5 text-gold-600" strokeWidth={1.6} /> {title}
      </h2>
      {children}
    </section>
  );
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await getVerifiedCustomer();
  if (!customer) redirect(`/login?next=/account/orders/${id}`);
  const [order, settings] = await Promise.all([
    getOrderForViewer(id, { customerId: customer.id, guestId: null }, null),
    getSettings(),
  ]);
  if (!order) notFound();

  const unpaidOnline =
    order.payment.method === "razorpay" && order.payment.status !== "paid" && order.status !== "cancelled" && order.status !== "returned";
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-stone transition hover:text-gold-700">
          <ArrowLeft className="size-4" /> All orders
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Order details</span>
            <h1 className="mt-1 text-3xl text-charcoal sm:text-4xl">#{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-stone">
              Placed on {formatDate(order.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })} · {itemCount} item
              {itemCount === 1 ? "" : "s"}
            </p>
          </div>
          <OrderStatusBadge status={order.status} className="text-xs" />
        </div>
      </div>

      {unpaidOnline && (
        <Reveal className="flex flex-col gap-4 rounded-3xl border border-gold-200 bg-gold-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-display text-2xl text-charcoal">Payment pending</p>
            <p className="text-sm text-stone">
              {paymentsEnabled()
                ? "Complete your payment to confirm this order. Your items are reserved for you."
                : "Online payment is temporarily unavailable. Please contact us to complete this order."}
            </p>
          </div>
          {paymentsEnabled() && <RetryPaymentButton orderId={order._id} orderNumber={order.orderNumber} storeName={settings.storeName} />}
        </Reveal>
      )}

      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl text-charcoal sm:text-2xl">
              <Truck className="size-5 text-gold-600" strokeWidth={1.6} /> Tracking
            </h2>
            {order.trackingNumber ? (
              <span className="rounded-full bg-cream px-3 py-1 text-xs text-ink">
                Tracking no. <span className="font-semibold tracking-wide">{order.trackingNumber}</span>
              </span>
            ) : (
              order.status !== "cancelled" && order.status !== "returned" && (
                <span className="text-xs text-stone">Est. delivery {settings.shipping.estimatedDelivery}</span>
              )
            )}
          </div>
          <OrderTracker order={order} />
        </section>
      </Reveal>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Reveal>
            <Card title="Items" icon={Package}>
              <OrderItemsList items={order.items} />
            </Card>
          </Reveal>
          <Reveal>
            <Card title="Order activity" icon={Truck}>
              <StatusTimeline history={order.statusHistory} />
            </Card>
          </Reveal>
        </div>
        <div className="flex flex-col gap-6">
          <Reveal>
            <Card title="Summary" icon={CreditCard}>
              <OrderTotals order={order} />
              <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-ivory p-4 text-sm">
                <span className="text-stone">{PAYMENT_METHOD_LABEL[order.payment.method]}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <PaymentStatusBadge status={order.payment.status} />
                  {order.payment.paidAt && <span className="text-xs text-stone">on {formatDate(order.payment.paidAt)}</span>}
                </div>
                {order.payment.providerPaymentId && (
                  <span className="break-all text-[11px] text-stone">Ref: {order.payment.providerPaymentId}</span>
                )}
              </div>
            </Card>
          </Reveal>
          <Reveal>
            <Card title="Delivering to" icon={MapPin}>
              <AddressBlock address={order.shippingAddress} />
              <p className="mt-4 border-t border-border pt-4 text-xs text-stone">
                Updates are sent to {order.contact.email}
                {order.contact.phone && <> and {order.contact.phone}</>}.
              </p>
            </Card>
          </Reveal>
          {order.notes && (
            <Reveal>
              <section className="rounded-3xl border border-border bg-card p-5 text-sm text-stone shadow-soft sm:p-7">
                <p className="mb-1 text-xs uppercase tracking-[0.16em] text-stone">Order note</p>
                {order.notes}
              </section>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
