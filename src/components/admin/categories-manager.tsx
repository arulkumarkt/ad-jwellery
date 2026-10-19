"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, CornerDownRight, FolderTree, LoaderCircle, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/common/modal";
import { FormField } from "@/components/common/form-field";
import { EASE } from "@/components/motion";
import { api } from "@/lib/fetcher";
import { cn, slugify } from "@/lib/utils";
import type { CategoryDTO } from "@/types";
import { AdminImage } from "./admin-image";
import { adminInput, adminSelect, adminTextarea, notifyError } from "./admin-utils";
import { ConfirmDialog } from "./confirm-dialog";
import { CharCount, ToggleRow } from "./form-bits";
import { SingleImageField } from "./image-uploader";
import { PageHeader } from "./page-header";
import { Pill } from "./status-badge";

interface CatForm {
  name: string;
  slug: string;
  parent: string;
  description: string;
  image: string;
  bannerImage: string;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
}

const emptyForm = (parent = ""): CatForm => ({
  name: "",
  slug: "",
  parent,
  description: "",
  image: "",
  bannerImage: "",
  isFeatured: false,
  isActive: true,
  seoTitle: "",
  seoDescription: "",
});

const byOrder = (a: CategoryDTO, b: CategoryDTO) => a.order - b.order || a.name.localeCompare(b.name);

export function CategoriesManager({ categories, canEdit }: { categories: CategoryDTO[]; canEdit: boolean }) {
  const router = useRouter();
  const [list, setList] = useState(categories);
  const [prevProp, setPrevProp] = useState(categories);
  if (prevProp !== categories) {
    setPrevProp(categories);
    setList(categories);
  }

  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatForm>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);

  const parents = list.filter((c) => !c.parent).sort(byOrder);
  const childrenOf = (id: string) => list.filter((c) => c.parent === id).sort(byOrder);

  function openCreate(parent = "") {
    setEditing(null);
    setForm(emptyForm(parent));
    setSlugTouched(false);
    setErrors({});
    setOpen(true);
  }

  function openEdit(c: CategoryDTO) {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parent: c.parent ?? "",
      description: c.description,
      image: c.image,
      bannerImage: c.bannerImage,
      isFeatured: c.isFeatured,
      isActive: c.isActive,
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
    });
    setSlugTouched(true);
    setErrors({});
    setOpen(true);
  }

  function upd<K extends keyof CatForm>(k: K, v: CatForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...form,
      parent: form.parent || null,
      // Preserve position when editing (the API would otherwise reset it to 0).
      ...(editing ? { order: editing.parent === (form.parent || null) ? editing.order : 0 } : {}),
    };
    try {
      if (editing) {
        await api(`/api/categories/${editing._id}`, { method: "PUT", body });
        toast.success("Category updated");
      } else {
        await api("/api/categories", { method: "POST", body });
        toast.success("Category created");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't save category"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/categories/${toDelete._id}`, { method: "DELETE" });
      toast.success(`“${toDelete.name}” deleted`);
      setToDelete(null);
      router.refresh();
    } catch (err) {
      notifyError(err, "Couldn't delete category");
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function move(siblings: CategoryDTO[], index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= siblings.length) return;
    const ids = siblings.map((s) => s._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const prev = list;
    setList((l) => l.map((c) => (ids.includes(c._id) ? { ...c, order: ids.indexOf(c._id) } : c)));
    setReordering(siblings[index]._id);
    try {
      await api("/api/categories/reorder", { method: "PUT", body: { ids } });
      router.refresh();
    } catch (err) {
      setList(prev);
      notifyError(err, "Couldn't reorder");
    } finally {
      setReordering(null);
    }
  }

  const hasChildren = editing ? list.some((c) => c.parent === editing._id) : false;

  const renderRow = (c: CategoryDTO, siblings: CategoryDTO[], index: number, child?: boolean) => {
    return (
      <motion.div
        key={c._id}
        layout
        transition={{ duration: 0.35, ease: EASE }}
        className={cn(
          "flex items-center gap-3 px-4 py-3 sm:px-5",
          child ? "bg-ivory/40 pl-6 sm:pl-10" : "bg-white",
        )}
      >
        {child && <CornerDownRight className="size-4 shrink-0 text-gold-300" />}
        <AdminImage src={c.image} alt={c.name} className={cn("shrink-0 rounded-xl ring-1 ring-border", child ? "size-10" : "size-12")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("truncate text-charcoal", child ? "text-sm" : "font-display text-lg font-semibold")}>{c.name}</p>
            {!c.isActive && <Pill>Hidden</Pill>}
            {c.isFeatured && (
              <Pill tone="gold">
                <Star className="size-3" /> Featured
              </Pill>
            )}
          </div>
          <p className="truncate text-xs text-stone">
            /{c.slug} · {c.productCount ?? 0} product{c.productCount === 1 ? "" : "s"}
            {!child && ` · ${childrenOf(c._id).length} subcategories`}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-0.5">
            <div className="mr-1 flex flex-col">
              <button
                type="button"
                onClick={() => move(siblings, index, -1)}
                disabled={index === 0 || !!reordering}
                className="grid h-5 w-7 place-items-center rounded text-stone transition hover:bg-gold-50 hover:text-gold-700 disabled:opacity-25"
                aria-label={`Move ${c.name} up`}
              >
                <ChevronUp className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => move(siblings, index, 1)}
                disabled={index === siblings.length - 1 || !!reordering}
                className="grid h-5 w-7 place-items-center rounded text-stone transition hover:bg-gold-50 hover:text-gold-700 disabled:opacity-25"
                aria-label={`Move ${c.name} down`}
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            {!child && (
              <button
                type="button"
                onClick={() => openCreate(c._id)}
                className="hidden h-8 items-center gap-1 rounded-full px-2.5 text-xs text-stone transition hover:bg-gold-50 hover:text-gold-700 sm:inline-flex"
              >
                <Plus className="size-3.5" /> Sub
              </button>
            )}
            <button
              type="button"
              onClick={() => openEdit(c)}
              className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-gold-50 hover:text-gold-700"
              aria-label={`Edit ${c.name}`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setToDelete(c)}
              className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-rose-50 hover:text-rose-700"
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Organise collections. Subcategories can be one level deep; use the arrows to set display order."
        actions={
          canEdit ? (
            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-medium text-charcoal shadow-soft transition hover:shadow-lift"
            >
              <Plus className="size-4" /> New category
            </button>
          ) : null
        }
      />

      {parents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
          <FolderTree className="mx-auto size-8 text-gold-500" strokeWidth={1.4} />
          <p className="mt-3 font-display text-2xl text-charcoal">No categories yet</p>
          <p className="mt-1 text-sm text-stone">Create collections like Necklaces, Earrings and Bangles.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {parents.map((p, i) => {
            const kids = childrenOf(p._id);
            return (
              <motion.div
                key={p._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: Math.min(i, 10) * 0.04 }}
                className="overflow-hidden rounded-2xl border border-border shadow-soft"
              >
                {renderRow(p, parents, i)}
                {kids.length > 0 && (
                  <div className="divide-y divide-border/60 border-t border-border/60">
                    {kids.map((k, ki) => renderRow(k, kids, ki, true))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? "Edit category" : "New category"} size="lg">
        <form onSubmit={save} noValidate className="p-6 sm:p-8">
          <p className="eyebrow">{editing ? "Edit" : "Create"}</p>
          <h2 className="mt-1 font-display text-3xl text-charcoal">{editing ? editing.name : "New category"}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="c-name" error={errors.name} required>
              <input
                id="c-name"
                className={adminInput}
                value={form.name}
                aria-invalid={!!errors.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                }}
                autoFocus
              />
            </FormField>
            <FormField label="Slug" htmlFor="c-slug" error={errors.slug}>
              <input
                id="c-slug"
                className={adminInput}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
              />
            </FormField>
            <FormField
              label="Parent category"
              htmlFor="c-parent"
              error={errors.parent}
              hint={hasChildren ? "Has subcategories, so it must stay top-level." : undefined}
              className="sm:col-span-2"
            >
              <select
                id="c-parent"
                className={adminSelect}
                value={form.parent}
                disabled={hasChildren}
                onChange={(e) => upd("parent", e.target.value)}
              >
                <option value="">None — top-level category</option>
                {parents
                  .filter((p) => p._id !== editing?._id)
                  .map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </FormField>
            <FormField label="Description" htmlFor="c-desc" error={errors.description} className="sm:col-span-2">
              <textarea
                id="c-desc"
                className={adminTextarea}
                value={form.description}
                maxLength={600}
                onChange={(e) => upd("description", e.target.value)}
              />
            </FormField>
            <FormField label="Thumbnail image" error={errors.image}>
              <SingleImageField value={form.image} onChange={(v) => upd("image", v)} aspect="aspect-[4/5]" />
            </FormField>
            <FormField label="Banner image" error={errors.bannerImage} hint="Wide image for the category page header.">
              <SingleImageField value={form.bannerImage} onChange={(v) => upd("bannerImage", v)} aspect="aspect-[16/7]" />
            </FormField>
            <ToggleRow label="Active" description="Show on storefront" checked={form.isActive} onChange={(v) => upd("isActive", v)} />
            <ToggleRow label="Featured" description="Highlight on homepage" checked={form.isFeatured} onChange={(v) => upd("isFeatured", v)} />
            <FormField label="SEO title" htmlFor="c-seo" error={errors.seoTitle} className="sm:col-span-2">
              <div className="relative">
                <input id="c-seo" className={cn(adminInput, "pr-16")} value={form.seoTitle} onChange={(e) => upd("seoTitle", e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
                  <CharCount value={form.seoTitle} max={70} />
                </span>
              </div>
            </FormField>
            <FormField label="SEO description" htmlFor="c-seod" error={errors.seoDescription} className="sm:col-span-2">
              <div className="relative">
                <textarea
                  id="c-seod"
                  className={cn(adminTextarea, "min-h-20 pb-6")}
                  value={form.seoDescription}
                  onChange={(e) => upd("seoDescription", e.target.value)}
                />
                <span className="absolute bottom-2 right-3 text-[11px]">
                  <CharCount value={form.seoDescription} max={170} />
                </span>
              </div>
            </FormField>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            {editing ? (
              <Link href={`/category/${editing.slug}`} target="_blank" className="text-xs font-medium text-gold-700 hover:underline">
                View on store
              </Link>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
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
                {editing ? "Save changes" : "Create category"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this category?"
        description={
          <>
            <strong className="text-charcoal">{toDelete?.name}</strong> will be removed. Categories that still contain
            products or subcategories can&apos;t be deleted.
          </>
        }
      />
    </div>
  );
}
