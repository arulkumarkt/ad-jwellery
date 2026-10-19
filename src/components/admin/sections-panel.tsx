"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Gem,
  Grid2x2,
  Camera,
  LayoutGrid,
  LoaderCircle,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/common/modal";
import { FormField } from "@/components/common/form-field";
import { EASE } from "@/components/motion";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { BannerDTO, CategoryDTO, HomeSectionDTO, HomeSectionType, SectionItemDTO } from "@/types";
import { AdminImage } from "./admin-image";
import { adminInput, adminSelect, adminTextarea, notifyError, num } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { FormSection, GoldSwitch, ToggleRow } from "./form-bits";
import { SingleImageField } from "./image-uploader";
import { ProductPicker, type PickedProduct } from "./product-picker";
import { Pill } from "./status-badge";

type ItemField = keyof SectionItemDTO;

export const SECTION_TYPES: Record<
  HomeSectionType,
  { label: string; icon: LucideIcon; description: string; uses: "products" | "categories" | "banner" | "items" | "none"; itemFields?: ItemField[] }
> = {
  "featured-categories": { label: "Featured categories", icon: LayoutGrid, description: "Category tiles", uses: "categories" },
  "shop-by-type": { label: "Shop by type", icon: Grid2x2, description: "Category grid by jewellery type", uses: "categories" },
  "best-sellers": { label: "Best sellers", icon: Award, description: "Product carousel", uses: "products" },
  "new-arrivals": { label: "New arrivals", icon: Sparkles, description: "Product carousel", uses: "products" },
  "featured-products": { label: "Featured products", icon: Gem, description: "Hand-picked products", uses: "products" },
  "promo-banner": { label: "Promo banner", icon: Megaphone, description: "Full-width promotional banner", uses: "banner" },
  "why-choose-us": {
    label: "Why choose us",
    icon: TrendingUp,
    description: "Brand promises with icons",
    uses: "items",
    itemFields: ["title", "text", "icon"],
  },
  testimonials: {
    label: "Testimonials",
    icon: MessageSquareQuote,
    description: "Customer quotes",
    uses: "items",
    itemFields: ["text", "author", "meta", "rating", "image"],
  },
  "social-gallery": {
    label: "Social gallery",
    icon: Camera,
    description: "Instagram-style image grid",
    uses: "items",
    itemFields: ["image", "href", "title", "meta"],
  },
  newsletter: { label: "Newsletter", icon: Mail, description: "Email sign-up block", uses: "none" },
};

const ITEM_LABELS: Record<ItemField, string> = {
  title: "Title",
  text: "Text",
  icon: "Icon name (lucide)",
  image: "Image",
  href: "Link",
  author: "Author",
  meta: "Meta (city / handle)",
  rating: "Rating (0–5)",
};

const blankItem = (): SectionItemDTO => ({ title: "", text: "", icon: "", image: "", href: "", author: "", meta: "", rating: 0 });

interface SectionForm {
  type: HomeSectionType;
  eyebrow: string;
  title: string;
  subtitle: string;
  limit: string;
  isActive: boolean;
  products: PickedProduct[];
  categoryIds: string[];
  bannerId: string;
  items: SectionItemDTO[];
}

export function sectionBody(s: HomeSectionDTO) {
  return {
    type: s.type,
    eyebrow: s.eyebrow,
    title: s.title,
    subtitle: s.subtitle,
    order: s.order,
    isActive: s.isActive,
    limit: s.limit,
    productIds: s.productIds,
    categoryIds: s.categoryIds,
    bannerId: s.bannerId,
    items: s.items,
  };
}

export function SectionsPanel({
  sections,
  categories,
  promoBanners,
  productMap,
  canEdit,
}: {
  sections: HomeSectionDTO[];
  categories: CategoryDTO[];
  promoBanners: BannerDTO[];
  productMap: Record<string, PickedProduct>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [list, setList] = useState(sections);
  const [prev, setPrev] = useState(sections);
  if (prev !== sections) {
    setPrev(sections);
    setList(sections);
  }
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HomeSectionDTO | null>(null);
  const [form, setForm] = useState<SectionForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<HomeSectionDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const catName = new Map(categories.map((c) => [c._id, c.name]));

  function openCreate() {
    setEditing(null);
    setForm({
      type: "featured-products",
      eyebrow: "",
      title: "",
      subtitle: "",
      limit: "8",
      isActive: true,
      products: [],
      categoryIds: [],
      bannerId: "",
      items: [],
    });
    setErrors({});
    setOpen(true);
  }

  function openEdit(s: HomeSectionDTO) {
    setEditing(s);
    setForm({
      type: s.type,
      eyebrow: s.eyebrow,
      title: s.title,
      subtitle: s.subtitle,
      limit: String(s.limit),
      isActive: s.isActive,
      products: s.productIds.map((id) => productMap[id] ?? { _id: id, name: "Unavailable product", image: "", price: 0 }),
      categoryIds: s.categoryIds,
      bannerId: s.bannerId ?? "",
      items: s.items.length ? s.items : [],
    });
    setErrors({});
    setOpen(true);
  }

  function upd<K extends keyof SectionForm>(k: K, v: SectionForm[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setErrors({});
    const uses = SECTION_TYPES[form.type].uses;
    const body = {
      type: form.type,
      eyebrow: form.eyebrow,
      title: form.title,
      subtitle: form.subtitle,
      order: editing ? editing.order : list.length,
      isActive: form.isActive,
      limit: Math.min(24, Math.max(1, Math.trunc(num(form.limit, 8)))),
      productIds: uses === "products" ? form.products.map((p) => p._id) : [],
      categoryIds: uses === "categories" ? form.categoryIds : [],
      bannerId: uses === "banner" && form.bannerId ? form.bannerId : null,
      items: uses === "items" ? form.items : [],
    };
    try {
      if (editing) await api(`/api/home-sections/${editing._id}`, { method: "PUT", body });
      else await api("/api/home-sections", { method: "POST", body });
      toast.success(editing ? "Section updated" : "Section added");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't save section"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: HomeSectionDTO) {
    setBusy(s._id);
    try {
      await api(`/api/home-sections/${s._id}`, { method: "PUT", body: { ...sectionBody(s), isActive: !s.isActive } });
      toast.success(s.isActive ? "Section hidden" : "Section visible");
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't update section");
    } finally {
      setBusy(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    const before = list;
    setList(next.map((s, i) => ({ ...s, order: i })));
    setBusy(list[index]._id);
    try {
      await api("/api/home-sections/reorder", { method: "PUT", body: { ids: next.map((s) => s._id) } });
      router.refresh();
    } catch (err) {
      setList(before);
      notifyError(err, "Couldn't reorder sections");
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/home-sections/${toDelete._id}`, { method: "DELETE" });
      toast.success("Section removed");
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete section");
    } finally {
      setDeleting(false);
    }
  }

  function summary(s: HomeSectionDTO): string {
    const meta = SECTION_TYPES[s.type];
    switch (meta.uses) {
      case "products":
        return s.productIds.length ? `${s.productIds.length} hand-picked products` : `Automatic · up to ${s.limit} products`;
      case "categories":
        return s.categoryIds.length
          ? s.categoryIds.map((id) => catName.get(id) ?? "—").join(", ")
          : `Automatic · featured categories (${s.limit})`;
      case "banner":
        return promoBanners.find((b) => b._id === s.bannerId)?.title ?? "First live promo banner";
      case "items":
        return `${s.items.length} item${s.items.length === 1 ? "" : "s"}`;
      default:
        return meta.description;
    }
  }

  const meta = form ? SECTION_TYPES[form.type] : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone">Sections render on the homepage top to bottom, below the hero banners.</p>
        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-medium text-charcoal shadow-soft transition hover:shadow-lift"
          >
            <Plus className="size-4" /> Add section
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
          <LayoutGrid className="mx-auto size-8 text-gold-500" strokeWidth={1.4} />
          <p className="mt-3 font-display text-2xl text-charcoal">No sections yet</p>
          <p className="mt-1 text-sm text-stone">Add featured products, categories and testimonials to build your homepage.</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {list.map((s, i) => {
            const m = SECTION_TYPES[s.type];
            const Icon = m.icon;
            return (
              <motion.li
                key={s._id}
                layout
                transition={{ duration: 0.35, ease: EASE }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-soft sm:gap-4 sm:p-4",
                  s.isActive ? "border-border" : "border-dashed border-border opacity-70",
                )}
              >
                <span className="w-6 text-center font-display text-xl text-gold-500 tabular-nums">{i + 1}</span>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                  <Icon className="size-5" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-charcoal">{s.title || m.label}</p>
                    <Pill tone="gold">{m.label}</Pill>
                    {!s.isActive && <Pill>Hidden</Pill>}
                  </div>
                  <p className="truncate text-xs text-stone">{summary(s)}</p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || !!busy}
                        className="grid h-5 w-7 place-items-center rounded text-stone hover:bg-gold-50 hover:text-gold-700 disabled:opacity-25"
                        aria-label="Move up"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === list.length - 1 || !!busy}
                        className="grid h-5 w-7 place-items-center rounded text-stone hover:bg-gold-50 hover:text-gold-700 disabled:opacity-25"
                        aria-label="Move down"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                    <GoldSwitch
                      checked={s.isActive}
                      disabled={busy === s._id}
                      onCheckedChange={() => toggleActive(s)}
                      aria-label={s.isActive ? "Hide section" : "Show section"}
                      className="mx-1"
                    />
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="grid size-8 place-items-center rounded-full text-stone hover:bg-gold-50 hover:text-gold-700"
                      aria-label="Edit section"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(s)}
                      className="grid size-8 place-items-center rounded-full text-stone hover:bg-rose-50 hover:text-rose-700"
                      aria-label="Delete section"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </motion.li>
            );
          })}
        </ol>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Edit section" : "Add section"} size="xl">
        {form && meta && (
          <form onSubmit={save} noValidate className="p-6 sm:p-8">
            <p className="eyebrow">{editing ? "Edit section" : "Add section"}</p>
            <h2 className="mt-1 font-display text-3xl text-charcoal">{form.title || meta.label}</h2>

            <div className="mt-6 flex flex-col gap-5">
              <FormField label="Section type" error={errors.type}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {(Object.keys(SECTION_TYPES) as HomeSectionType[]).map((t) => {
                    const T = SECTION_TYPES[t];
                    const Icon = T.icon;
                    const on = form.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => upd("type", t)}
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition",
                          on ? "border-gold-400 bg-gold-50 ring-2 ring-gold-200" : "border-border hover:border-gold-200",
                        )}
                      >
                        <Icon className={cn("size-4", on ? "text-gold-700" : "text-stone")} />
                        <span className="text-xs font-medium text-charcoal">{T.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Eyebrow" htmlFor="s-eyebrow" error={errors.eyebrow}>
                  <input id="s-eyebrow" className={adminInput} value={form.eyebrow} onChange={(e) => upd("eyebrow", e.target.value)} />
                </FormField>
                <FormField label="Title" htmlFor="s-title" error={errors.title} className="sm:col-span-2">
                  <input id="s-title" className={adminInput} value={form.title} onChange={(e) => upd("title", e.target.value)} placeholder={meta.label} />
                </FormField>
                <FormField label="Subtitle" htmlFor="s-sub" error={errors.subtitle} className="sm:col-span-3">
                  <textarea id="s-sub" className={cn(adminTextarea, "min-h-16")} value={form.subtitle} maxLength={300} onChange={(e) => upd("subtitle", e.target.value)} />
                </FormField>
                {(meta.uses === "products" || meta.uses === "categories") && (
                  <FormField label="Limit" htmlFor="s-limit" error={errors.limit} hint="Max items when automatic (1–24)">
                    <input id="s-limit" type="number" min={1} max={24} className={adminInput} value={form.limit} onChange={(e) => upd("limit", e.target.value)} />
                  </FormField>
                )}
                <div className={cn("flex items-end", meta.uses === "products" || meta.uses === "categories" ? "sm:col-span-2" : "sm:col-span-3")}>
                  <div className="w-full">
                    <ToggleRow label="Visible on homepage" checked={form.isActive} onChange={(v) => upd("isActive", v)} />
                  </div>
                </div>
              </div>

              {meta.uses === "products" && (
                <FormSection title="Products" description="Pick specific products, or leave empty to fill automatically." className="bg-ivory/40 shadow-none">
                  <ProductPicker value={form.products} onChange={(v) => upd("products", v)} />
                  {errors.productIds && <p className="mt-2 text-xs text-destructive">{errors.productIds}</p>}
                </FormSection>
              )}

              {meta.uses === "categories" && (
                <FormSection title="Categories" description="Select in display order, or leave empty to use featured categories." className="bg-ivory/40 shadow-none">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const idx = form.categoryIds.indexOf(c._id);
                      const on = idx >= 0;
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() =>
                            upd("categoryIds", on ? form.categoryIds.filter((id) => id !== c._id) : [...form.categoryIds, c._id])
                          }
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition",
                            on ? "border-gold-400 bg-gold-50 text-gold-800" : "border-border bg-white text-stone hover:border-gold-200",
                          )}
                        >
                          <AdminImage src={c.image} alt="" className="size-6 rounded-full" />
                          {c.parent && <span className="text-stone/60">↳</span>}
                          {c.name}
                          {on && <span className="grid size-4 place-items-center rounded-full bg-gold-500 text-[9px] font-bold text-white">{idx + 1}</span>}
                        </button>
                      );
                    })}
                  </div>
                </FormSection>
              )}

              {meta.uses === "banner" && (
                <FormField label="Promo banner" htmlFor="s-banner" error={errors.bannerId} hint="Manage promo banners in the Banners tab.">
                  <select id="s-banner" className={adminSelect} value={form.bannerId} onChange={(e) => upd("bannerId", e.target.value)}>
                    <option value="">Automatic — first live promo banner</option>
                    {promoBanners.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.title}
                        {!b.isActive ? " (hidden)" : ""}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}

              {meta.uses === "items" && meta.itemFields && (
                <FormSection
                  title="Items"
                  description={meta.description}
                  className="bg-ivory/40 shadow-none"
                  actions={
                    <button
                      type="button"
                      onClick={() => upd("items", [...form.items, blankItem()])}
                      disabled={form.items.length >= 24}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-xs font-medium hover:border-gold-300 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" /> Add item
                    </button>
                  }
                >
                  {form.items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-stone">No items yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {form.items.map((item, idx) => {
                        const setItem = (patch: Partial<SectionItemDTO>) =>
                          upd(
                            "items",
                            form.items.map((it, k) => (k === idx ? { ...it, ...patch } : it)),
                          );
                        const moveItem = (dir: -1 | 1) => {
                          const j = idx + dir;
                          if (j < 0 || j >= form.items.length) return;
                          const next = [...form.items];
                          [next[idx], next[j]] = [next[j], next[idx]];
                          upd("items", next);
                        };
                        return (
                          <li key={idx} className="rounded-xl border border-border bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone">Item {idx + 1}</span>
                              <div className="flex gap-0.5">
                                <button type="button" onClick={() => moveItem(-1)} disabled={idx === 0} className="grid size-7 place-items-center rounded text-stone hover:bg-muted disabled:opacity-25" aria-label="Move item up">
                                  <ChevronUp className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveItem(1)}
                                  disabled={idx === form.items.length - 1}
                                  className="grid size-7 place-items-center rounded text-stone hover:bg-muted disabled:opacity-25"
                                  aria-label="Move item down"
                                >
                                  <ChevronDown className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => upd("items", form.items.filter((_, k) => k !== idx))}
                                  className="grid size-7 place-items-center rounded text-stone hover:bg-rose-50 hover:text-rose-700"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {meta.itemFields!.map((f) => {
                                const err = errors[`items.${idx}.${f}`];
                                if (f === "image") {
                                  return (
                                    <FormField key={f} label={ITEM_LABELS[f]} error={err}>
                                      <div className="max-w-[200px]">
                                        <SingleImageField value={item.image} onChange={(v) => setItem({ image: v })} aspect="aspect-square" />
                                      </div>
                                    </FormField>
                                  );
                                }
                                if (f === "text") {
                                  return (
                                    <FormField key={f} label={ITEM_LABELS[f]} error={err} className="sm:col-span-2">
                                      <textarea className={cn(adminTextarea, "min-h-16")} value={item.text} maxLength={600} onChange={(e) => setItem({ text: e.target.value })} />
                                    </FormField>
                                  );
                                }
                                if (f === "rating") {
                                  return (
                                    <FormField key={f} label={ITEM_LABELS[f]} error={err}>
                                      <input
                                        type="number"
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className={adminInput}
                                        value={String(item.rating)}
                                        onChange={(e) => setItem({ rating: Math.min(5, Math.max(0, num(e.target.value))) })}
                                      />
                                    </FormField>
                                  );
                                }
                                return (
                                  <FormField key={f} label={ITEM_LABELS[f]} error={err}>
                                    <input
                                      className={adminInput}
                                      value={item[f] as string}
                                      onChange={(e) => setItem({ [f]: e.target.value } as Partial<SectionItemDTO>)}
                                      placeholder={f === "icon" ? "sparkles, gem, truck…" : f === "href" ? "https://instagram.com/p/…" : undefined}
                                    />
                                  </FormField>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </FormSection>
              )}
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
                {editing ? "Save section" : "Add section"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Remove this section?"
        description={`“${toDelete?.title || (toDelete ? SECTION_TYPES[toDelete.type].label : "")}” will be removed from the homepage.`}
      />
    </div>
  );
}
