import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CreditCard, Mail, MapPin, Phone, StickyNote, Truck, UserRound } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getOrderById, ORDER_TRANSITIONS } from "@/services/order.service";
import { formatPrice } from "@/lib/utils";
import { AdminImage } from "@/components/admin/admin-image";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusPanel, PrintButton } from "@/components/admin/order-status-panel";
import { StatusBadge, capitalize } from "@/components/admin/status-badge";
import { cardClass } from "@/components/admin/admin-styles";

type Params = Promise<{ id: string }>;
const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
const dt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = isObjectId(id) ? await getOrderById(id) : null;
  return { title: order ? `Order #${order.orderNumber}` : "Order" };
}

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const order = await getOrderById(id);
  if (!order) notFound();

  const a = order.shippingAddress;
  const history = [...order.statusHistory].reverse();

  return (
    <div className="print:text-black">
      <PageHeader
        back={{ href: "/admin/orders", label: "All orders" }}
        eyebrow={`Placed ${dt(order.createdAt)}`}
        title={`Order #${order.orderNumber}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment.status} kind="payment" />
            <span>{order.payment.method === "cod" ? "Cash on delivery" : "Online payment"}</span>
          </span>
        }
        actions={<PrintButton />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Items */}
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <h2 className="font-display text-2xl text-charcoal">Items</h2>
              <span className="text-xs text-stone">
                {order.items.reduce((s, i) => s + i.quantity, 0)} pieces
              </span>
            </div>
            <ul className="divide-y divide-border/70">
              {order.items.map((item) => (
                <li key={item._id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <AdminImage src={item.image} alt={item.name} className="size-16 shrink-0 rounded-xl ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${item.product}`}
                      className="line-clamp-1 font-medium text-charcoal hover:text-gold-700"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-stone">
                      <span className="font-mono">{item.sku}</span>
                      {item.variantLabel && ` · ${item.variantLabel}`}
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-stone">
                      {formatPrice(item.price)} × {item.quantity}
                      {item.mrp > item.price && <span className="ml-2 line-through">{formatPrice(item.mrp)}</span>}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-charcoal">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-border bg-ivory/60 px-5 py-5 text-sm sm:px-6">
              <div className="flex justify-between">
                <dt className="text-stone">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <dt>Discount{order.coupon.code && ` (${order.coupon.code})`}</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone">Shipping</dt>
                <dd className="tabular-nums">{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd>
              </div>
              {order.codFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone">COD fee</dt>
                  <dd className="tabular-nums">{formatPrice(order.codFee)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-medium text-charcoal">Total</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums text-charcoal">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Timeline */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="font-display text-2xl text-charcoal">Timeline</h2>
            <ol className="relative mt-5 ml-2 border-l border-gold-200">
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    className={`absolute -left-[7px] top-1 size-3.5 rounded-full ring-4 ring-white ${i === 0 ? "bg-gold-gradient" : "bg-gold-200"}`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-charcoal">{capitalize(h.status)}</span>
                    <span className="text-xs text-stone">{dt(h.at)}</span>
                  </div>
                  {h.note && <p className="mt-1 text-sm text-stone">{h.note}</p>}
                </li>
              ))}
              {history.length === 0 && <li className="pl-6 text-sm text-stone">No history recorded.</li>}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <OrderStatusPanel
            key={order.updatedAt}
            orderId={order._id}
            status={order.status}
            allowed={ORDER_TRANSITIONS[order.status]}
            paymentStatus={order.payment.status}
            trackingNumber={order.trackingNumber}
          />

          <section className={`${cardClass} p-5`}>
            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
              <UserRound className="size-3.5 text-gold-600" /> Customer
            </h3>
            <p className="font-medium text-charcoal">{order.contact.name}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-stone">
              <Mail className="size-3.5" />
              <a href={`mailto:${order.contact.email}`} className="hover:text-gold-700">
                {order.contact.email}
              </a>
            </p>
            {order.contact.phone && (
              <p className="mt-1 flex items-center gap-2 text-sm text-stone">
                <Phone className="size-3.5" />
                <a href={`tel:${order.contact.phone}`} className="hover:text-gold-700">
                  {order.contact.phone}
                </a>
              </p>
            )}
            {order.customer ? (
              <Link
                href={`/admin/customers/${order.customer}`}
                className="mt-3 inline-block text-xs font-medium text-gold-700 hover:underline print:hidden"
              >
                View customer profile →
              </Link>
            ) : (
              <p className="mt-3 text-xs text-stone">Guest checkout</p>
            )}
          </section>

          <section className={`${cardClass} p-5`}>
            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
              <MapPin className="size-3.5 text-gold-600" /> Shipping address
            </h3>
            <address className="text-sm not-italic leading-relaxed text-charcoal">
              <span className="font-medium">{a.fullName}</span>
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              {a.landmark && (
                <>
                  <br />
                  Landmark: {a.landmark}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.pincode}
              <br />
              {a.country}
              <br />
              <span className="text-stone">{a.phone}</span>
            </address>
          </section>

          <section className={`${cardClass} p-5`}>
            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
              <CreditCard className="size-3.5 text-gold-600" /> Payment
            </h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Method</dt>
                <dd>{order.payment.method === "cod" ? "Cash on delivery" : "Razorpay"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-stone">Status</dt>
                <dd>
                  <StatusBadge status={order.payment.status} kind="payment" />
                </dd>
              </div>
              {order.payment.paidAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-stone">Paid at</dt>
                  <dd className="text-right">{dt(order.payment.paidAt)}</dd>
                </div>
              )}
              {order.payment.providerPaymentId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-stone">Payment ID</dt>
                  <dd className="truncate font-mono text-xs">{order.payment.providerPaymentId}</dd>
                </div>
              )}
              {order.payment.providerOrderId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-stone">Provider order</dt>
                  <dd className="truncate font-mono text-xs">{order.payment.providerOrderId}</dd>
                </div>
              )}
            </dl>
          </section>

          {(order.trackingNumber || order.notes) && (
            <section className={`${cardClass} p-5`}>
              {order.trackingNumber && (
                <p className="flex items-center gap-2 text-sm">
                  <Truck className="size-4 text-gold-600" />
                  <span className="text-stone">Tracking</span>
                  <span className="font-mono font-medium text-charcoal">{order.trackingNumber}</span>
                </p>
              )}
              {order.notes && (
                <div className={order.trackingNumber ? "mt-4" : undefined}>
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
                    <StickyNote className="size-3.5 text-gold-600" /> Customer note
                  </p>
                  <p className="mt-2 rounded-xl bg-ivory p-3 text-sm text-charcoal">{order.notes}</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
