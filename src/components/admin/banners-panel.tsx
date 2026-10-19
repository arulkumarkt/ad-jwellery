"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CalendarClock, ImageIcon, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/common/modal";
import { FormField } from "@/components/common/form-field";
import { EASE } from "@/components/motion";
import { api } from "@/lib/fetcher";
import { cn, formatDate } from "@/lib/utils";
import type { BannerDTO, BannerPlacement } from "@/types";
import { AdminImage } from "./admin-image";
import { adminInput, adminSelect, adminTextarea, fromLocalInput, notifyError, num, toLocalInput } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { GoldSwitch, ToggleRow } from "./form-bits";
import { SingleImageField } from "./image-uploader";
import { Pill } from "./status-badge";

const PLACEMENTS: { value: BannerPlacement; label: string; hint: string }[] = [
  { value: "hero", label: "Hero", hint: "Full-width slider at the top of the homepage" },
  { value: "promo", label: "Promo", hint: "Promotional banner used by promo sections" },
  { value: "strip", label: "Strip", hint: "Slim announcement strip" },
];

type BannerForm = Omit<BannerDTO, "_id" | "order" | "startsAt" | "endsAt"> & { order: string; startsAt: string; endsAt: string };

const blank = (placement: BannerPlacement = "hero"): BannerForm => ({
  placement,
  eyebrow: "",
  title: "",
  subtitle: "",
  image: "",
  mobileImage: "",
  ctaLabel: "",
  ctaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  theme: "light",
  order: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
});

export function bannerBody(b: BannerDTO) {
  const { _id, ...rest } = b;
  void _id;
  return rest;
}

function bannerState(b: BannerDTO, now: number): { label: string; tone: "success" | "info" | "neutral" | "danger" } {
  if (!b.isActive) return { label: "Hidden", tone: "danger" };
  if (b.endsAt && new Date(b.endsAt).getTime() < now) return { label: "Ended", tone: "neutral" };
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return { label: "Scheduled", tone: "info" };
  return { label: "Live", tone: "success" };
}

export function BannersPanel({ banners, canEdit, now }: { banners: BannerDTO[]; canEdit: boolean; now: number }) {
  const router = useRouter();
  const [filter, setFilter] = useState<BannerPlacement | "all">("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerDTO | null>(null);
  const [form, setForm] = useState<BannerForm>(blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BannerDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const shown = banners.filter((b) => filter === "all" || b.placement === filter);

  function upd<K extends keyof BannerForm>(k: K, v: BannerForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  function openCreate() {
    setEditing(null);
    const placement = filter === "all" ? "hero" : filter;
    setForm({ ...blank(placement), order: String(banners.filter((b) => b.placement === placement).length) });
    setErrors({});
    setOpen(true);
  }

  function openEdit(b: BannerDTO) {
    setEditing(b);
    setForm({ ...bannerBody(b), order: String(b.order), startsAt: toLocalInput(b.startsAt), endsAt: toLocalInput(b.endsAt) });
    setErrors({});
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...form,
      order: Math.trunc(num(form.order)),
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
    };
    try {
      if (editing) await api(`/api/banners/${editing._id}`, { method: "PUT", body });
      else await api("/api/banners", { method: "POST", body });
      toast.success(editing ? "Banner updated" : "Banner created");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't save banner"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: BannerDTO) {
    setToggling(b._id);
    try {
      await api(`/api/banners/${b._id}`, { method: "PUT", body: { ...bannerBody(b), isActive: !b.isActive } });
      toast.success(b.isActive ? "Banner hidden" : "Banner activated");
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't update banner");
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/banners/${toDelete._id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete banner");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-full border border-border bg-white p-1 shadow-soft">
          {(["all", "hero", "promo", "strip"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilter(p)}
              className={cn(
                "relative h-8 rounded-full px-3.5 text-xs font-medium capitalize transition-colors",
                filter === p ? "text-ivory" : "text-stone hover:text-charcoal",
              )}
            >
              {filter === p && <motion.span layoutId="banner-filter" className="absolute inset-0 rounded-full bg-charcoal" />}
              <span className="relative">
                {p} <span className="opacity-60">{p === "all" ? banners.length : banners.filter((b) => b.placement === p).length}</span>
              </span>
            </button>
          ))}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-medium text-charcoal shadow-soft transition hover:shadow-lift"
          >
            <Plus className="size-4" /> New banner
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
          <ImageIcon className="mx-auto size-8 text-gold-500" strokeWidth={1.4} />
          <p className="mt-3 font-display text-2xl text-charcoal">No banners here</p>
          <p className="mt-1 text-sm text-stone">Create a hero or promotional banner to dress up the homepage.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((b, i) => {
            const st = bannerState(b, now);
            return (
              <motion.article
                key={b._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:shadow-lift"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-cream">
                  <AdminImage src={b.image} alt={b.title} className="absolute inset-0 size-full transition duration-700 group-hover:scale-105" />
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col justify-end p-4",
                      b.theme === "dark" ? "bg-gradient-to-t from-charcoal/80 to-transparent text-ivory" : "bg-gradient-to-t from-ivory/90 to-transparent text-charcoal",
                    )}
                  >
                    {b.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">{b.eyebrow}</p>}
                    <p className="line-clamp-1 font-display text-2xl leading-tight">{b.title}</p>
                  </div>
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Pill tone="gold" className="bg-white/90 capitalize">
                      {b.placement}
                    </Pill>
                    <Pill tone={st.tone} className="bg-white/90">
                      {st.label}
                    </Pill>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 text-xs text-stone">
                    <p className="truncate">{b.ctaLabel ? `${b.ctaLabel} → ${b.ctaHref || "/"}` : "No call to action"}</p>
                    {(b.startsAt || b.endsAt) && (
                      <p className="mt-0.5 flex items-center gap-1">
                        <CalendarClock className="size-3" />
                        {b.startsAt ? formatDate(b.startsAt) : "Now"} – {b.endsAt ? formatDate(b.endsAt) : "∞"}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      <GoldSwitch
                        checked={b.isActive}
                        disabled={toggling === b._id}
                        onCheckedChange={() => toggleActive(b)}
                        aria-label={b.isActive ? "Hide banner" : "Activate banner"}
                      />
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="ml-1 grid size-8 place-items-center rounded-full text-stone hover:bg-gold-50 hover:text-gold-700"
                        aria-label="Edit banner"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(b)}
                        className="grid size-8 place-items-center rounded-full text-stone hover:bg-rose-50 hover:text-rose-700"
                        aria-label="Delete banner"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Edit banner" : "New banner"} size="xl">
        <form onSubmit={save} noValidate className="p-6 sm:p-8">
          <p className="eyebrow">{editing ? "Edit banner" : "New banner"}</p>
          <h2 className="mt-1 font-display text-3xl text-charcoal">{form.title || "Untitled banner"}</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col gap-4">
              <FormField label="Desktop image" error={errors.image} required hint="Wide, at least 1920×800.">
                <SingleImageField value={form.image} onChange={(v) => upd("image", v)} aspect="aspect-[16/7]" invalid={!!errors.image} />
              </FormField>
              <FormField label="Mobile image" error={errors.mobileImage} hint="Optional portrait crop, e.g. 900×1200.">
                <div className="max-w-[220px]">
                  <SingleImageField value={form.mobileImage} onChange={(v) => upd("mobileImage", v)} aspect="aspect-[3/4]" />
                </div>
              </FormField>
            </div>
            <div className="grid content-start gap-4 sm:grid-cols-2">
              <FormField label="Placement" htmlFor="b-place" error={errors.placement} className="sm:col-span-2" hint={PLACEMENTS.find((p) => p.value === form.placement)?.hint}>
                <select id="b-place" className={adminSelect} value={form.placement} onChange={(e) => upd("placement", e.target.value as BannerPlacement)}>
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Eyebrow" htmlFor="b-eyebrow" error={errors.eyebrow}>
                <input id="b-eyebrow" className={adminInput} value={form.eyebrow} onChange={(e) => upd("eyebrow", e.target.value)} placeholder="New collection" />
              </FormField>
              <FormField label="Theme" error={errors.theme}>
                <div className="grid h-10 grid-cols-2 rounded-xl border border-input bg-ivory p-1">
                  {(["light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => upd("theme", t)}
                      className={cn(
                        "rounded-lg text-xs font-medium capitalize transition",
                        form.theme === t ? "bg-charcoal text-ivory" : "text-stone",
                      )}
                    >
                      {t} text
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Title" htmlFor="b-title" error={errors.title} required className="sm:col-span-2">
                <input id="b-title" className={adminInput} value={form.title} aria-invalid={!!errors.title} onChange={(e) => upd("title", e.target.value)} />
              </FormField>
              <FormField label="Subtitle" htmlFor="b-sub" error={errors.subtitle} className="sm:col-span-2">
                <textarea id="b-sub" className={cn(adminTextarea, "min-h-16")} value={form.subtitle} maxLength={300} onChange={(e) => upd("subtitle", e.target.value)} />
              </FormField>
              <FormField label="Primary button" htmlFor="b-cta" error={errors.ctaLabel}>
                <input id="b-cta" className={adminInput} value={form.ctaLabel} onChange={(e) => upd("ctaLabel", e.target.value)} placeholder="Shop now" />
              </FormField>
              <FormField label="Primary link" htmlFor="b-ctah" error={errors.ctaHref}>
                <input id="b-ctah" className={adminInput} value={form.ctaHref} onChange={(e) => upd("ctaHref", e.target.value)} placeholder="/category/necklaces" />
              </FormField>
              <FormField label="Secondary button" htmlFor="b-cta2" error={errors.secondaryCtaLabel}>
                <input id="b-cta2" className={adminInput} value={form.secondaryCtaLabel} onChange={(e) => upd("secondaryCtaLabel", e.target.value)} />
              </FormField>
              <FormField label="Secondary link" htmlFor="b-cta2h" error={errors.secondaryCtaHref}>
                <input id="b-cta2h" className={adminInput} value={form.secondaryCtaHref} onChange={(e) => upd("secondaryCtaHref", e.target.value)} />
              </FormField>
              <FormField label="Starts" htmlFor="b-start" error={errors.startsAt} hint="Blank = immediately">
                <input id="b-start" type="datetime-local" className={adminInput} value={form.startsAt} onChange={(e) => upd("startsAt", e.target.value)} />
              </FormField>
              <FormField label="Ends" htmlFor="b-end" error={errors.endsAt} hint="Blank = never">
                <input id="b-end" type="datetime-local" className={adminInput} value={form.endsAt} onChange={(e) => upd("endsAt", e.target.value)} />
              </FormField>
              <FormField label="Order" htmlFor="b-order" error={errors.order} hint="Lower shows first">
                <input id="b-order" type="number" step={1} className={adminInput} value={form.order} onChange={(e) => upd("order", e.target.value)} />
              </FormField>
              <div className="flex items-end">
                <div className="w-full">
                  <ToggleRow label="Active" checked={form.isActive} onChange={(v) => upd("isActive", v)} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-medium text-ivory transition hover:bg-gold-700 disabled:opacity-50"
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {editing ? "Save banner" : "Create banner"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this banner?"
        description={
          <>
            <strong className="text-charcoal">{toDelete?.title}</strong> will be removed from the storefront. Sections using it will
            fall back to another promo banner.
          </>
        }
      />
    </div>
  );
}
