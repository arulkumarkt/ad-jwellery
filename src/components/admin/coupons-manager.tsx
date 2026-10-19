"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Copy, LoaderCircle, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/common/modal";
import { FormField } from "@/components/common/form-field";
import { api } from "@/lib/fetcher";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { CouponDTO } from "@/types";
import { adminInput, adminTextarea, fromLocalInput, notifyError, num, toLocalInput } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { DataTable, type Column } from "./data-table";
import { ToggleRow } from "./form-bits";
import { PageHeader } from "./page-header";
import { Pill } from "./status-badge";

type CouponState = "Active" | "Scheduled" | "Expired" | "Exhausted" | "Inactive";

export function couponState(c: CouponDTO, now: number): CouponState {
  if (!c.isActive) return "Inactive";
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return "Expired";
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return "Exhausted";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "Scheduled";
  return "Active";
}

const STATE_TONE = {
  Active: "success",
  Scheduled: "info",
  Expired: "neutral",
  Exhausted: "warning",
  Inactive: "danger",
} as const;

interface CouponForm {
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: string;
  maxDiscount: string;
  minOrderAmount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  isActive: boolean;
}

const blank: CouponForm = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  minOrderAmount: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "0",
  isActive: true,
};

export function CouponsManager({ coupons, canEdit, now }: { coupons: CouponDTO[]; canEdit: boolean; now: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CouponDTO | null>(null);
  const [form, setForm] = useState<CouponForm>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<CouponDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  function upd<K extends keyof CouponForm>(k: K, v: CouponForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function openCreate() {
    setEditing(null);
    setForm(blank);
    setErrors({});
    setOpen(true);
  }

  function openEdit(c: CouponDTO) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description,
      type: c.type,
      value: String(c.value),
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      startsAt: toLocalInput(c.startsAt),
      expiresAt: toLocalInput(c.expiresAt),
      usageLimit: String(c.usageLimit),
      isActive: c.isActive,
    });
    setErrors({});
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      type: form.type,
      value: num(form.value),
      maxDiscount: form.type === "percentage" ? num(form.maxDiscount) : 0,
      minOrderAmount: num(form.minOrderAmount),
      startsAt: fromLocalInput(form.startsAt),
      expiresAt: fromLocalInput(form.expiresAt),
      usageLimit: Math.trunc(num(form.usageLimit)),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await api(`/api/coupons/${editing._id}`, { method: "PUT", body });
        toast.success(`Coupon ${body.code} updated`);
      } else {
        await api("/api/coupons", { method: "POST", body });
        toast.success(`Coupon ${body.code} created`);
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't save coupon"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/coupons/${toDelete._id}`, { method: "DELETE" });
      toast.success(`Coupon ${toDelete.code} deleted`);
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<CouponDTO>[] = [
    {
      key: "code",
      header: "Code",
      cell: (c) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-dashed border-gold-300 bg-gold-50 px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-gold-700">
            {c.code}
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(c.code);
              toast.success("Code copied");
            }}
            className="grid size-7 place-items-center rounded-full text-stone hover:bg-muted"
            aria-label={`Copy ${c.code}`}
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: "offer",
      header: "Offer",
      cell: (c) => (
        <div className="max-w-56">
          <p className="font-medium text-charcoal">
            {c.type === "percentage" ? `${c.value}% off` : `${formatPrice(c.value)} off`}
            {c.type === "percentage" && c.maxDiscount > 0 && (
              <span className="text-xs font-normal text-stone"> · up to {formatPrice(c.maxDiscount)}</span>
            )}
          </p>
          <p className="truncate text-xs text-stone">
            {c.minOrderAmount ? `Min. order ${formatPrice(c.minOrderAmount)}` : "No minimum"}
            {c.description && ` · ${c.description}`}
          </p>
        </div>
      ),
    },
    {
      key: "validity",
      header: "Validity",
      cell: (c) => (
        <div className="whitespace-nowrap text-xs text-stone">
          <p>{c.startsAt ? `From ${formatDate(c.startsAt)}` : "Starts immediately"}</p>
          <p>{c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : "No expiry"}</p>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      cell: (c) => {
        const pct = c.usageLimit ? Math.min(100, (c.usedCount / c.usageLimit) * 100) : 0;
        return (
          <div className="w-28">
            <p className="text-xs tabular-nums text-charcoal">
              {c.usedCount} / {c.usageLimit || "∞"}
            </p>
            {c.usageLimit > 0 && (
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "state",
      header: "State",
      cell: (c) => {
        const st = couponState(c, now);
        return <Pill tone={STATE_TONE[st]}>{st}</Pill>;
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (c) =>
        canEdit ? (
          <div className="flex justify-end gap-0.5">
            <button
              type="button"
              onClick={() => openEdit(c)}
              className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-gold-50 hover:text-gold-700"
              aria-label={`Edit ${c.code}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setToDelete(c)}
              className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-rose-50 hover:text-rose-700"
              aria-label={`Delete ${c.code}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : null,
    },
  ];

  const isPct = form.type === "percentage";

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Coupons"
        description="Promo codes customers can apply at checkout."
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-medium text-charcoal shadow-soft transition hover:shadow-lift"
            >
              <Plus className="size-4" /> New coupon
            </button>
          ) : null
        }
      />
      <DataTable
        columns={columns}
        rows={coupons}
        rowKey={(c) => c._id}
        empty={{
          icon: TicketPercent,
          title: "No coupons yet",
          description: "Create a code like FESTIVE10 to reward your customers.",
        }}
      />

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Edit coupon" : "New coupon"} size="lg">
        <form onSubmit={save} noValidate className="p-6 sm:p-8">
          <p className="eyebrow">{editing ? "Edit coupon" : "New coupon"}</p>
          <h2 className="mt-1 font-display text-3xl text-charcoal">{form.code || "Untitled code"}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label="Code" htmlFor="cp-code" error={errors.code} required hint="3–32 letters, numbers, - or _">
              <input
                id="cp-code"
                className={cn(adminInput, "font-mono uppercase tracking-wider")}
                value={form.code}
                aria-invalid={!!errors.code}
                onChange={(e) => upd("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                autoFocus
              />
            </FormField>
            <FormField label="Discount type" error={errors.type}>
              <div className="grid h-10 grid-cols-2 rounded-xl border border-input bg-ivory p-1">
                {(["percentage", "fixed"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => upd("type", t)}
                    className={cn(
                      "rounded-lg text-xs font-medium transition",
                      form.type === t ? "bg-charcoal text-ivory shadow-soft" : "text-stone hover:text-charcoal",
                    )}
                  >
                    {t === "percentage" ? "Percentage %" : "Fixed amount ₹"}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Description" htmlFor="cp-desc" error={errors.description} className="sm:col-span-2">
              <textarea
                id="cp-desc"
                className={cn(adminTextarea, "min-h-16")}
                value={form.description}
                maxLength={200}
                onChange={(e) => upd("description", e.target.value)}
                placeholder="Shown to customers when applied, e.g. 10% off festive collection"
              />
            </FormField>
            <FormField label={isPct ? "Percentage off" : "Amount off (₹)"} htmlFor="cp-value" error={errors.value} required>
              <input
                id="cp-value"
                type="number"
                min={0}
                max={isPct ? 90 : undefined}
                className={cn(adminInput, "tabular-nums")}
                value={form.value}
                aria-invalid={!!errors.value}
                onChange={(e) => upd("value", e.target.value)}
              />
            </FormField>
            <FormField
              label="Max discount (₹)"
              htmlFor="cp-max"
              error={errors.maxDiscount}
              hint={isPct ? "0 or blank = no cap" : "Only for percentage coupons"}
            >
              <input
                id="cp-max"
                type="number"
                min={0}
                className={cn(adminInput, "tabular-nums")}
                value={isPct ? form.maxDiscount : ""}
                disabled={!isPct}
                onChange={(e) => upd("maxDiscount", e.target.value)}
              />
            </FormField>
            <FormField label="Minimum order (₹)" htmlFor="cp-min" error={errors.minOrderAmount}>
              <input
                id="cp-min"
                type="number"
                min={0}
                className={cn(adminInput, "tabular-nums")}
                value={form.minOrderAmount}
                onChange={(e) => upd("minOrderAmount", e.target.value)}
              />
            </FormField>
            <FormField
              label="Usage limit"
              htmlFor="cp-limit"
              error={errors.usageLimit}
              hint={editing ? `Used ${editing.usedCount} time${editing.usedCount === 1 ? "" : "s"} · 0 = unlimited` : "0 = unlimited"}
            >
              <input
                id="cp-limit"
                type="number"
                min={0}
                step={1}
                className={cn(adminInput, "tabular-nums")}
                value={form.usageLimit}
                onChange={(e) => upd("usageLimit", e.target.value)}
              />
            </FormField>
            <FormField label="Starts" htmlFor="cp-start" error={errors.startsAt} hint="Blank = immediately">
              <input
                id="cp-start"
                type="datetime-local"
                className={adminInput}
                value={form.startsAt}
                onChange={(e) => upd("startsAt", e.target.value)}
              />
            </FormField>
            <FormField label="Expires" htmlFor="cp-end" error={errors.expiresAt} hint="Blank = never">
              <input
                id="cp-end"
                type="datetime-local"
                className={adminInput}
                value={form.expiresAt}
                aria-invalid={!!errors.expiresAt}
                onChange={(e) => upd("expiresAt", e.target.value)}
              />
            </FormField>
            <div className="sm:col-span-2">
              <ToggleRow
                label="Active"
                description="Inactive coupons can't be applied at checkout"
                checked={form.isActive}
                onChange={(v) => upd("isActive", v)}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-medium text-ivory transition hover:bg-gold-700 disabled:opacity-50"
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editing ? "Save coupon" : "Create coupon"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this coupon?"
        description={
          <>
            Code <strong className="font-mono text-charcoal">{toDelete?.code}</strong> will stop working immediately.
          </>
        }
      />
    </div>
  );
}
