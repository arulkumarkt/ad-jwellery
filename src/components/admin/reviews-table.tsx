"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RatingStars } from "@/components/common/rating-stars";
import { api } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";
import type { ReviewDTO } from "@/types";
import { notifyError } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { DataTable, type Column } from "./data-table";
import { GoldSwitch } from "./form-bits";
import { Pill } from "./status-badge";

type Row = ReviewDTO & { productName: string };

export function ReviewsTable({ reviews, canEdit }: { reviews: Row[]; canEdit: boolean }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function toggle(r: Row) {
    const current = overrides[r._id] ?? r.isApproved;
    setBusy(r._id);
    setOverrides((o) => ({ ...o, [r._id]: !current }));
    try {
      await api(`/api/admin/reviews/${r._id}`, { method: "PATCH", body: { isApproved: !current } });
      toast.success(current ? "Review hidden" : "Review approved");
      router.refresh();
    } catch (err) {
      setOverrides((o) => ({ ...o, [r._id]: current }));
      notifyError(err, "Couldn't update review");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/admin/reviews/${toDelete._id}`, { method: "DELETE" });
      toast.success("Review deleted");
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete review");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Row>[] = [
    {
      key: "product",
      header: "Product",
      cell: (r) => (
        <Link href={`/admin/products/${r.product}`} className="line-clamp-2 max-w-44 text-sm font-medium text-charcoal hover:text-gold-700">
          {r.productName}
        </Link>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      cell: (r) => <RatingStars value={r.rating} size={13} />,
    },
    {
      key: "review",
      header: "Review",
      className: "min-w-72",
      cell: (r) => (
        <div className="max-w-md">
          {r.title && <p className="text-sm font-medium text-charcoal">{r.title}</p>}
          <p className="line-clamp-3 text-xs leading-relaxed text-stone">{r.comment}</p>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      cell: (r) => (
        <div className="whitespace-nowrap text-xs">
          <p className="flex items-center gap-1 font-medium text-charcoal">
            {r.name}
            {r.isVerifiedPurchase && <BadgeCheck className="size-3.5 text-emerald-600" aria-label="Verified purchase" />}
          </p>
          <p className="text-stone">
            {r.location ? `${r.location} · ` : ""}
            {formatDate(r.createdAt)}
          </p>
          {r.isVerifiedPurchase && <Pill tone="success" className="mt-1">Verified</Pill>}
        </div>
      ),
    },
    {
      key: "approved",
      header: "Visible",
      cell: (r) => {
        const on = overrides[r._id] ?? r.isApproved;
        return (
          <div className="flex items-center gap-2">
            <GoldSwitch
              checked={on}
              disabled={!canEdit || busy === r._id}
              onCheckedChange={() => toggle(r)}
              aria-label={on ? "Hide review" : "Approve review"}
            />
            <span className="text-xs text-stone">{on ? "Shown" : "Hidden"}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (r) =>
        canEdit ? (
          <button
            type="button"
            onClick={() => setToDelete(r)}
            className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-rose-50 hover:text-rose-700"
            aria-label="Delete review"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={reviews}
        rowKey={(r) => r._id}
        empty={{ icon: Star, title: "No reviews yet", description: "Customer reviews will appear here for moderation." }}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this review?"
        description={`The review by ${toDelete?.name ?? "this customer"} will be permanently removed and the product rating recalculated.`}
      />
    </>
  );
}
