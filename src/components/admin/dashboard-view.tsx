"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowUpRight,
  Clock,
  Gem,
  IndianRupee,
  LoaderCircle,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { EASE } from "@/components/motion";
import { api } from "@/lib/fetcher";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { DashboardStatsDTO, OrderDTO, OrderStatus } from "@/types";
import { AdminImage } from "./admin-image";
import { notifyError } from "./admin-utils";
import { DataTable, type Column } from "./data-table";
import { PageHeader } from "./page-header";
import { StatCard } from "./stat-card";
import { capitalize, ORDER_STATUS_COLORS, StatusBadge } from "./status-badge";

const RANGES = [7, 30, 90] as const;
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

interface TooltipEntry {
  payload: { date: string; sales: number; orders: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-gold-200 bg-charcoal px-3.5 py-2.5 text-xs text-ivory shadow-lift">
      <p className="text-ivory/60">{formatDate(p.date, { weekday: "short", day: "numeric", month: "short" })}</p>
      <p className="mt-1 font-display text-lg font-semibold text-gold-200 tabular-nums">{formatPrice(p.sales)}</p>
      <p className="text-ivory/70">
        {p.orders} order{p.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
}

const recentColumns: Column<OrderDTO>[] = [
  {
    key: "order",
    header: "Order",
    cell: (o) => (
      <div>
        <p className="font-medium text-charcoal">#{o.orderNumber}</p>
        <p className="text-xs text-stone">{formatDate(o.createdAt)}</p>
      </div>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    cell: (o) => (
      <div className="max-w-44">
        <p className="truncate text-charcoal">{o.contact.name}</p>
        <p className="truncate text-xs text-stone">{o.contact.email}</p>
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  {
    key: "total",
    header: "Total",
    headerClassName: "text-right",
    className: "text-right font-semibold tabular-nums text-charcoal",
    cell: (o) => formatPrice(o.total),
  },
];

export function DashboardView({
  initial,
  adminName,
  greeting,
  today,
}: {
  initial: DashboardStatsDTO;
  adminName: string;
  greeting: string;
  today: string;
}) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [series, setSeries] = useState(initial.salesByDay);
  const [loading, setLoading] = useState(false);
  const s = initial;

  async function changeRange(next: (typeof RANGES)[number]) {
    if (next === days) return;
    setDays(next);
    setLoading(true);
    try {
      const data = await api<DashboardStatsDTO>(`/api/admin/dashboard?days=${next}`);
      setSeries(data.salesByDay);
    } catch (err) {
      notifyError(err, "Couldn't load sales data");
    } finally {
      setLoading(false);
    }
  }

  const periodSales = series.reduce((sum, d) => sum + d.sales, 0);
  const periodOrders = series.reduce((sum, d) => sum + d.orders, 0);
  const totalStatus = s.statusBreakdown.reduce((sum, x) => sum + x.count, 0);
  const statusOrder: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
  const breakdown = statusOrder
    .map((status) => ({ status, count: s.statusBreakdown.find((b) => b.status === status)?.count ?? 0 }))
    .filter((b) => b.count > 0);
  const maxSold = Math.max(1, ...s.bestSellers.map((b) => b.sold));

  return (
    <div>
      <PageHeader
        eyebrow={today}
        title={
          <>
            {greeting}, <span className="italic text-gold-gradient">{adminName.split(" ")[0]}</span>
          </>
        }
        description="Here's how the atelier is performing today."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard index={0} label="Total sales" value={s.totalSales} currency icon={IndianRupee} tone="gold" hint="Excl. cancelled & returned" />
        <StatCard index={1} label="Orders" value={s.totalOrders} icon={ShoppingBag} href="/admin/orders" hint="All time" />
        <StatCard index={2} label="Customers" value={s.totalCustomers} icon={Users} href="/admin/customers" hint="Registered accounts" />
        <StatCard index={3} label="Products" value={s.totalProducts} icon={Gem} href="/admin/products" hint="In catalogue" />
        <StatCard
          index={4}
          label="Pending"
          value={s.pendingOrders}
          icon={Clock}
          tone={s.pendingOrders ? "warning" : "default"}
          href="/admin/orders?status=pending"
          hint="Awaiting fulfilment"
        />
        <StatCard
          index={5}
          label="Low stock"
          value={s.lowStockProducts}
          icon={PackageX}
          tone={s.lowStockProducts ? "warning" : "default"}
          href="/admin/products?status=low-stock"
          hint="5 units or fewer"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Sales chart */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6 xl:col-span-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">Revenue · last {days} days</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-charcoal">{formatPrice(periodSales)}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-stone">
                <TrendingUp className="size-3.5 text-gold-600" />
                {periodOrders} orders · avg {formatPrice(periodOrders ? periodSales / periodOrders : 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {loading && <LoaderCircle className="size-4 animate-spin text-gold-600" />}
              <div className="inline-flex rounded-full border border-border bg-ivory p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => changeRange(r)}
                    className={cn(
                      "relative h-7 rounded-full px-3 text-xs font-medium transition-colors",
                      days === r ? "text-ivory" : "text-stone hover:text-charcoal",
                    )}
                  >
                    {days === r && (
                      <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-charcoal" />
                    )}
                    <span className="relative">{r}d</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className={cn("mt-6 h-72 transition-opacity", loading && "opacity-50")}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c99d4b" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#c99d4b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#e6cd92" />
                    <stop offset="50%" stopColor="#c99d4b" />
                    <stop offset="100%" stopColor="#956a29" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#efe6d6" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6f675c" }}
                  tickFormatter={(d: string) => formatDate(d, { day: "numeric", month: "short" })}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#6f675c" }}
                  tickFormatter={(v: number) => `₹${compact.format(v)}`}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#d8b46a", strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="url(#goldStroke)"
                  strokeWidth={2.5}
                  fill="url(#goldFill)"
                  activeDot={{ r: 5, fill: "#b48536", stroke: "#fff", strokeWidth: 2 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Status breakdown */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.28 }}
          className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6"
        >
          <h2 className="font-display text-2xl text-charcoal">Order status</h2>
          <p className="text-xs text-stone">{totalStatus} orders in total</p>
          {breakdown.length ? (
            <>
              <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-muted">
                {breakdown.map((b, i) => (
                  <motion.div
                    key={b.status}
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.count / totalStatus) * 100}%` }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.05 }}
                    style={{ background: ORDER_STATUS_COLORS[b.status] }}
                    title={`${capitalize(b.status)}: ${b.count}`}
                  />
                ))}
              </div>
              <ul className="mt-5 space-y-2.5">
                {breakdown.map((b) => (
                  <li key={b.status}>
                    <Link
                      href={`/admin/orders?status=${b.status}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition hover:bg-ivory"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="size-2.5 rounded-full" style={{ background: ORDER_STATUS_COLORS[b.status] }} />
                        <span className="text-charcoal">{capitalize(b.status)}</span>
                      </span>
                      <span className="tabular-nums text-stone">
                        <span className="font-semibold text-charcoal">{b.count}</span>
                        <span className="ml-2 text-xs">{Math.round((b.count / totalStatus) * 100)}%</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-10 text-center text-sm text-stone">No orders yet.</p>
          )}
        </motion.section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl text-charcoal">Recent orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-gold-700 hover:underline">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <DataTable
            columns={recentColumns}
            rows={s.recentOrders}
            rowKey={(o) => o._id}
            rowHref={(o) => `/admin/orders/${o._id}`}
            empty={{ icon: ShoppingBag, title: "No orders yet", description: "New orders will appear here." }}
            dense
          />
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl text-charcoal">Best sellers</h2>
            <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs font-medium text-gold-700 hover:underline">
              Catalogue <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-white p-2 shadow-soft">
            {s.bestSellers.length ? (
              <ul>
                {s.bestSellers.map((b, i) => (
                  <motion.li
                    key={b._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-ivory"
                  >
                    <span className="w-4 text-center font-display text-lg text-gold-500">{i + 1}</span>
                    <AdminImage src={b.image} alt={b.name} className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${b.slug}`}
                        target="_blank"
                        className="block truncate text-sm font-medium text-charcoal hover:text-gold-700"
                      >
                        {b.name}
                      </Link>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-gold-gradient"
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.sold / maxSold) * 100}%` }}
                          transition={{ duration: 0.9, ease: EASE, delay: 0.4 + i * 0.05 }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-charcoal">{b.sold} sold</p>
                      <p className="text-xs tabular-nums text-stone">{formatPrice(b.revenue)}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-12 text-center text-sm text-stone">Sales data will appear once orders come in.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
