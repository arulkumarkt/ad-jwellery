import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { listAdminProducts } from "@/services/product.service";
import { listAllCategories } from "@/services/category.service";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsTable } from "@/components/admin/products-table";
import { Pagination } from "@/components/common/pagination";
import { hasRole } from "@/components/admin/admin-roles";

export const metadata = { title: "Products" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const STATUSES = ["active", "inactive", "low-stock", "out-of-stock"] as const;

export default async function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const q = one(sp.q);
  const category = one(sp.category);
  const statusRaw = one(sp.status);
  const status = (STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as (typeof STATUSES)[number]) : undefined;
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const [data, categories] = await Promise.all([
    listAdminProducts({ q: q || undefined, category: category || undefined, status, page, pageSize: 20 }),
    listAllCategories(),
  ]);

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (status) next.set("status", status);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${data.total} piece${data.total === 1 ? "" : "s"}${q || category || status ? " matching your filters" : " in your catalogue"}.`}
        actions={
          hasRole(admin.role, "manager") ? (
            <Link href="/admin/products/new" className={buttonVariants({ variant: "gold", size: "lg" })}>
              <Plus /> Add product
            </Link>
          ) : null
        }
      />
      <ProductsTable
        products={data.items}
        categories={categories.map((c) => ({ _id: c._id, name: c.name, parent: c.parent }))}
        canEdit={hasRole(admin.role, "manager")}
      />
      <Pagination className="mt-8" page={data.page} totalPages={data.totalPages} hrefFor={hrefFor} />
    </div>
  );
}
