import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listCustomers } from "@/services/customer.service";
import { PageHeader } from "@/components/admin/page-header";
import { CustomersTable } from "@/components/admin/customers-table";
import { Pagination } from "@/components/common/pagination";

export const metadata = { title: "Customers" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminCustomersPage({ searchParams }: { searchParams: SP }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const q = one(sp.q);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const data = await listCustomers({ q: q || undefined, page, pageSize: 20 });

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description={`${data.total} customer${data.total === 1 ? "" : "s"}${q ? ` matching “${q}”` : " registered"}.`}
      />
      <CustomersTable customers={data.items} />
      <Pagination className="mt-8" page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </div>
  );
}
