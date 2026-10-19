import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listOrders } from "@/services/order.service";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { Pagination } from "@/components/common/pagination";
import type { OrderStatus } from "@/types";

export const metadata = { title: "Orders" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: SP }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const q = one(sp.q);
  const statusRaw = one(sp.status);
  const status = STATUSES.includes(statusRaw as OrderStatus) ? (statusRaw as OrderStatus) : undefined;
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [data, ...counts] = await Promise.all([
    listOrders({ q: q || undefined, status, page, pageSize: 20 }),
    listOrders({ q: q || undefined, pageSize: 1 }).then((r) => r.total),
    ...STATUSES.map((s) => listOrders({ q: q || undefined, status: s, pageSize: 1 }).then((r) => r.total)),
  ]);

  const tabs = [
    { value: "", label: "All", count: counts[0] },
    ...STATUSES.map((s, i) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1), count: counts[i + 1] })),
  ];

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description={`${data.total} order${data.total === 1 ? "" : "s"}${status ? ` · ${status}` : ""}${q ? ` matching “${q}”` : ""}.`}
      />
      <OrdersTable orders={data.items} tabs={tabs} />
      <Pagination className="mt-8" page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </div>
  );
}
