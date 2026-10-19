"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Gem, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductDTO } from "@/types";
import { AdminImage } from "./admin-image";
import { adminSelect, notifyError } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { DataTable, type Column } from "./data-table";
import { FilterTabs } from "./filter-tabs";
import { SearchInput } from "./search-input";
import { Pill } from "./status-badge";

interface CatOption {
  _id: string;
  name: string;
  parent: string | null;
}

const iconBtn =
  "grid size-8 place-items-center rounded-full text-stone transition hover:bg-gold-50 hover:text-gold-700";

export function ProductsTable({
  products,
  categories,
  canEdit,
}: {
  products: ProductDTO[];
  categories: CatOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [toDelete, setToDelete] = useState<ProductDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  function setCategory(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("category", value);
    else next.delete("category");
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/products/${toDelete._id}`, { method: "DELETE" });
      toast.success(`“${toDelete.name}” deleted`);
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete product");
    } finally {
      setDeleting(false);
    }
  }

  const parents = categories.filter((c) => !c.parent);

  const columns: Column<ProductDTO>[] = [
    {
      key: "product",
      header: "Product",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <AdminImage
            src={p.images.find((i) => i.isMain)?.thumbnail || p.images[0]?.thumbnail || p.images[0]?.url}
            alt={p.name}
            className="size-12 shrink-0 rounded-xl ring-1 ring-border"
          />
          <div className="min-w-0">
            <p className="max-w-64 truncate font-medium text-charcoal">{p.name}</p>
            <p className="font-mono text-[11px] text-stone">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (p) => (
        <div className="text-xs">
          <p className="text-charcoal">{p.category?.name ?? "—"}</p>
          {p.subcategory && <p className="text-stone">{p.subcategory.name}</p>}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (p) => (
        <div className="tabular-nums">
          <p className="font-semibold text-charcoal">{formatPrice(p.price)}</p>
          {p.mrp > p.price && <p className="text-xs text-stone line-through">{formatPrice(p.mrp)}</p>}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <span className="tabular-nums text-charcoal">
            {p.stock}
            {p.variants.length > 0 && <span className="ml-1 text-[11px] text-stone">· {p.variants.length} var.</span>}
          </span>
          {p.stock === 0 ? <Pill tone="danger">Out of stock</Pill> : p.stock <= 5 ? <Pill tone="warning">Low</Pill> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => (p.isActive ? <Pill tone="success">Active</Pill> : <Pill>Hidden</Pill>),
    },
    {
      key: "flags",
      header: "Flags",
      cell: (p) => {
        const flags = [
          p.isFeatured && "Featured",
          p.isBestSeller && "Best seller",
          p.isNewArrival && "New",
          p.isTrending && "Trending",
        ].filter(Boolean) as string[];
        return flags.length ? (
          <div className="flex max-w-48 flex-wrap gap-1">
            {flags.map((f) => (
              <Pill key={f} tone="gold">
                {f}
              </Pill>
            ))}
          </div>
        ) : (
          <span className="text-xs text-stone/60">—</span>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-0.5">
          <Link href={`/admin/products/${p._id}`} className={iconBtn} title="Edit" aria-label={`Edit ${p.name}`}>
            <Pencil className="size-4" />
          </Link>
          <Link
            href={`/product/${p.slug}`}
            target="_blank"
            className={iconBtn}
            title="View on store"
            aria-label={`View ${p.name} on store`}
          >
            <ExternalLink className="size-4" />
          </Link>
          {canEdit && (
            <button
              type="button"
              onClick={() => setToDelete(p)}
              className={cn(iconBtn, "hover:bg-rose-50 hover:text-rose-700")}
              title="Delete"
              aria-label={`Delete ${p.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          layoutId="product-status"
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Hidden" },
            { value: "low-stock", label: "Low stock" },
            { value: "out-of-stock", label: "Out of stock" },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={params.get("category") ?? ""}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(adminSelect, "rounded-full sm:w-52")}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {parents.map((c) => (
              <optgroup key={c._id} label={c.name}>
                <option value={c._id}>All {c.name}</option>
                {categories
                  .filter((s) => s.parent === c._id)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <SearchInput placeholder="Search name, SKU or tag…" />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p._id}
        rowHref={(p) => `/admin/products/${p._id}`}
        empty={{
          icon: Gem,
          title: "No products found",
          description: params.toString() ? "Try clearing filters or searching for something else." : "Add your first piece to begin.",
          action: canEdit ? (
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 items-center rounded-full bg-charcoal px-5 text-sm font-medium text-ivory hover:bg-gold-700"
            >
              Add product
            </Link>
          ) : undefined,
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this product?"
        description={
          <>
            <strong className="text-charcoal">{toDelete?.name}</strong> will be permanently removed from the catalogue,
            homepage sections and wishlists. Past orders are not affected.
          </>
        }
      />
    </>
  );
}
