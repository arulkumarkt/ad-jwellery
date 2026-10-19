import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, Mail, MapPin, Megaphone, Phone } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getCustomerDetail } from "@/services/customer.service";
import { formatDate, formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { CustomerOrdersTable } from "@/components/admin/orders-table";
import { CustomerActiveToggle } from "@/components/admin/customer-active-toggle";
import { Pill } from "@/components/admin/status-badge";
import { cardClass } from "@/components/admin/admin-styles";
import { hasRole } from "@/components/admin/admin-roles";

type Params = Promise<{ id: string }>;
const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const detail = isObjectId(id) ? await getCustomerDetail(id) : null;
  return { title: detail ? detail.customer.name : "Customer" };
}

export default async function AdminCustomerDetailPage({ params }: { params: Params }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();
  const { customer: c, orders, addresses } = detail;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const avg = c.orderCount ? (c.totalSpent ?? 0) / Math.max(1, orders.filter((o) => !["cancelled", "returned"].includes(o.status)).length) : 0;
  const initials = c.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const stats = [
    { label: "Orders", value: String(c.orderCount ?? 0) },
    { label: "Total spent", value: formatPrice(c.totalSpent ?? 0) },
    { label: "Avg. order", value: formatPrice(avg) },
    { label: "Delivered", value: String(delivered) },
  ];

  return (
    <div>
      <PageHeader back={{ href: "/admin/customers", label: "All customers" }} eyebrow="Customer" title={c.name} />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section className={`${cardClass} overflow-hidden`}>
            <div className="relative h-20 bg-charcoal">
              <div className="absolute inset-0 bg-gold-gradient opacity-30" />
            </div>
            <div className="-mt-10 px-5 pb-5">
              <span className="grid size-20 place-items-center rounded-full bg-gold-gradient font-display text-3xl font-semibold text-charcoal ring-4 ring-white">
                {initials}
              </span>
              <div className="mt-3 flex items-center gap-2">
                <h2 className="font-display text-2xl text-charcoal">{c.name}</h2>
                {c.isActive ? <Pill tone="success">Active</Pill> : <Pill tone="danger">Disabled</Pill>}
              </div>
              <ul className="mt-4 space-y-2 text-sm text-stone">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-gold-600" />
                  <a href={`mailto:${c.email}`} className="truncate hover:text-gold-700">
                    {c.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-gold-600" />
                  {c.phone || "No phone"}
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-gold-600" />
                  Joined {formatDate(c.createdAt)}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-gold-600" />
                  {c.lastLoginAt ? `Last seen ${formatDate(c.lastLoginAt)}` : "Never signed in"}
                </li>
                <li className="flex items-center gap-2">
                  <Megaphone className="size-4 text-gold-600" />
                  {c.marketingOptIn ? "Subscribed to marketing" : "Not subscribed"}
                </li>
              </ul>
              <div className="mt-5 border-t border-border pt-4">
                <CustomerActiveToggle
                  customerId={c._id}
                  name={c.name}
                  isActive={c.isActive}
                  canEdit={hasRole(admin.role, "manager")}
                />
              </div>
            </div>
          </section>

          <section className={`${cardClass} p-5`}>
            <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">
              <MapPin className="size-3.5 text-gold-600" /> Addresses
            </h3>
            {addresses.length ? (
              <ul className="space-y-3">
                {addresses.map((a) => (
                  <li key={a._id} className="rounded-xl border border-border bg-ivory/50 p-3 text-sm leading-relaxed">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-charcoal">{a.label || a.fullName}</span>
                      {a.isDefault && <Pill tone="gold">Default</Pill>}
                    </div>
                    <p className="text-stone">
                      {a.fullName} · {a.phone}
                      <br />
                      {a.line1}
                      {a.line2 && `, ${a.line2}`}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone">No saved addresses.</p>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className={`${cardClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-charcoal">{s.value}</p>
              </div>
            ))}
          </div>
          <section>
            <h2 className="mb-3 font-display text-2xl text-charcoal">Order history</h2>
            <CustomerOrdersTable orders={orders} />
          </section>
        </div>
      </div>
    </div>
  );
}
