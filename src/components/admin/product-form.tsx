"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EASE } from "@/components/motion";
import { FormField } from "@/components/common/form-field";
import { api } from "@/lib/fetcher";
import { cn, discountPercent, formatPrice, slugify } from "@/lib/utils";
import type { CategoryDTO, ImageDTO, ProductDTO } from "@/types";
import { AdminImage } from "./admin-image";
import { adminInput, adminSelect, adminTextarea, notifyError, num } from "./admin-utils";
import { ChipsInput } from "./chips-input";
import { CharCount, FormSection, ToggleRow } from "./form-bits";
import { ImageUploader, SingleImageField } from "./image-uploader";

interface VariantRow {
  key: string;
  _id?: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  mrp: string;
  stock: string;
  images: ImageDTO[];
}

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  images: ImageDTO[];
  price: string;
  mrp: string;
  sku: string;
  stock: string;
  variants: VariantRow[];
  category: string;
  subcategory: string;
  jewelleryType: string;
  material: string;
  plating: string;
  color: string;
  weight: string;
  size: string;
  occasion: string[];
  tags: string[];
  careInstructions: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  isActive: boolean;
  seo: { title: string; description: string; ogImage: string };
}

const JEWELLERY_TYPES = [
  "Necklace",
  "Necklace set",
  "Haram",
  "Choker",
  "Earrings",
  "Jhumkas",
  "Bangles",
  "Bracelet",
  "Ring",
  "Maang tikka",
  "Nose ring",
  "Anklet",
  "Waist belt",
  "Hair accessory",
  "Pendant",
  "Mangalsutra",
];
const PLATINGS = ["Gold plated", "1 gram gold", "Antique gold", "Matte gold", "Rose gold", "Silver plated", "Oxidised", "Rhodium"];
const OCCASIONS = ["Bridal", "Wedding", "Festive", "Party", "Daily wear", "Office", "Temple"];

let keySeq = 0;
const newKey = () => `v${Date.now().toString(36)}${(keySeq++).toString(36)}`;

function toState(p: ProductDTO | null): FormState {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    shortDescription: p?.shortDescription ?? "",
    description: p?.description ?? "",
    images: p?.images ?? [],
    price: p ? String(p.price) : "",
    mrp: p ? String(p.mrp) : "",
    sku: p?.sku ?? "",
    stock: p ? String(p.stock) : "0",
    variants:
      p?.variants.map((v) => ({
        key: v._id,
        _id: v._id,
        name: v.name,
        sku: v.sku,
        color: v.color,
        size: v.size,
        price: String(v.price),
        mrp: String(v.mrp),
        stock: String(v.stock),
        images: v.images,
      })) ?? [],
    category: p?.category?._id ?? "",
    subcategory: p?.subcategory?._id ?? "",
    jewelleryType: p?.jewelleryType ?? "",
    material: p?.material ?? "",
    plating: p?.plating ?? "",
    color: p?.color ?? "",
    weight: p?.weight ?? "",
    size: p?.size ?? "",
    occasion: p?.occasion ?? [],
    tags: p?.tags ?? [],
    careInstructions: p?.careInstructions ?? "",
    isFeatured: p?.isFeatured ?? false,
    isBestSeller: p?.isBestSeller ?? false,
    isNewArrival: p?.isNewArrival ?? true,
    isTrending: p?.isTrending ?? false,
    isActive: p?.isActive ?? true,
    seo: p?.seo ?? { title: "", description: "", ogImage: "" },
  };
}

function normalizeImages(images: ImageDTO[]): ImageDTO[] {
  const mainIdx = Math.max(0, images.findIndex((i) => i.isMain));
  return images.map((img, i) => ({ ...img, isMain: i === mainIdx }));
}

function toPayload(s: FormState) {
  const variants = s.variants.map((v) => ({
    ...(v._id ? { _id: v._id } : {}),
    name: v.name.trim(),
    sku: v.sku.trim(),
    color: v.color.trim(),
    size: v.size.trim(),
    price: num(v.price),
    mrp: num(v.mrp, num(v.price)),
    stock: Math.trunc(num(v.stock)),
    images: normalizeImages(v.images),
  }));
  return {
    name: s.name.trim(),
    slug: s.slug.trim(),
    shortDescription: s.shortDescription,
    description: s.description,
    category: s.category,
    subcategory: s.subcategory || null,
    images: normalizeImages(s.images),
    price: num(s.price),
    mrp: num(s.mrp, num(s.price)),
    sku: s.sku.trim(),
    stock: variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : Math.trunc(num(s.stock)),
    material: s.material,
    plating: s.plating,
    jewelleryType: s.jewelleryType,
    occasion: s.occasion,
    color: s.color,
    weight: s.weight,
    size: s.size,
    careInstructions: s.careInstructions,
    variants,
    tags: s.tags,
    isFeatured: s.isFeatured,
    isBestSeller: s.isBestSeller,
    isNewArrival: s.isNewArrival,
    isTrending: s.isTrending,
    isActive: s.isActive,
    seo: s.seo,
  };
}

/** Image grid with drag-to-reorder, move buttons, set-main, alt text and remove. */
function ImageGallery({
  images,
  onChange,
  max = 15,
  compact,
}: {
  images: ImageDTO[];
  onChange: (next: ImageDTO[]) => void;
  max?: number;
  compact?: boolean;
}) {
  const dragFrom = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const mainIdx = Math.max(0, images.findIndex((i) => i.isMain));

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function update(i: number, patch: Partial<ImageDTO>) {
    onChange(images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)));
  }

  function add(added: { url: string; thumbnail: string }[]) {
    const room = max - images.length;
    if (room <= 0) {
      toast.error(`Up to ${max} images allowed`);
      return;
    }
    onChange([
      ...images,
      ...added.slice(0, room).map((a, i) => ({ url: a.url, thumbnail: a.thumbnail, alt: "", isMain: !images.length && i === 0 })),
    ]);
  }

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 && (
        <ul className={cn("grid gap-3", compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
          <AnimatePresence initial={false}>
            {images.map((img, i) => (
              <motion.li
                key={img.url + i}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: EASE }}
                draggable
                onDragStart={() => (dragFrom.current = i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(i);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom.current !== null) move(dragFrom.current, i);
                  dragFrom.current = null;
                  setOver(null);
                }}
                onDragEnd={() => {
                  dragFrom.current = null;
                  setOver(null);
                }}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border bg-white transition",
                  i === mainIdx ? "border-gold-400 ring-2 ring-gold-200" : "border-border",
                  over === i && "ring-2 ring-gold-400",
                )}
              >
                <div className="relative aspect-square cursor-grab bg-cream active:cursor-grabbing">
                  <AdminImage src={img.thumbnail || img.url} alt={img.alt} className="absolute inset-0 size-full" />
                  <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-md bg-white/85 text-stone opacity-0 transition group-hover:opacity-100">
                    <GripVertical className="size-3.5" />
                  </span>
                  {i === mainIdx && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                      Main
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-charcoal/75 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, i - 1)}
                        disabled={i === 0}
                        className="grid size-7 place-items-center rounded-full bg-white/90 text-charcoal disabled:opacity-30"
                        aria-label="Move left"
                      >
                        <ArrowLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, i + 1)}
                        disabled={i === images.length - 1}
                        className="grid size-7 place-items-center rounded-full bg-white/90 text-charcoal disabled:opacity-30"
                        aria-label="Move right"
                      >
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {i !== mainIdx && (
                        <button
                          type="button"
                          onClick={() => onChange(images.map((im, idx) => ({ ...im, isMain: idx === i })))}
                          className="grid size-7 place-items-center rounded-full bg-white/90 text-gold-700"
                          aria-label="Set as main image"
                          title="Set as main"
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                        className="grid size-7 place-items-center rounded-full bg-white/90 text-rose-700"
                        aria-label="Remove image"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {!compact && (
                  <input
                    value={img.alt}
                    onChange={(e) => update(i, { alt: e.target.value })}
                    placeholder="Alt text"
                    maxLength={160}
                    className="h-8 border-t border-border px-2.5 text-xs outline-none placeholder:text-stone/60 focus:bg-gold-50/40"
                    aria-label={`Alt text for image ${i + 1}`}
                  />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {images.length < max && (
        <ImageUploader onAdd={add} compact={compact || images.length > 0} label={compact ? "Add variant images" : undefined} />
      )}
    </div>
  );
}

export function ProductForm({ product, categories }: { product: ProductDTO | null; categories: CategoryDTO[] }) {
  const router = useRouter();
  const [initial, setInitial] = useState(() => toState(product));
  const [s, setS] = useState<FormState>(initial);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [openVariant, setOpenVariant] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(initial), [s, initial]);
  const parents = categories.filter((c) => !c.parent);
  const subs = categories.filter((c) => c.parent && c.parent === s.category);
  const hasVariants = s.variants.length > 0;
  const variantStock = s.variants.reduce((sum, v) => sum + Math.trunc(num(v.stock)), 0);
  const discount = discountPercent(num(s.price), num(s.mrp));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function setVariant(key: string, patch: Partial<VariantRow>) {
    setS((prev) => ({ ...prev, variants: prev.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));
  }

  function addVariant() {
    const key = newKey();
    setS((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          key,
          name: "",
          sku: prev.sku ? `${prev.sku}-${prev.variants.length + 1}` : "",
          color: "",
          size: "",
          price: prev.price,
          mrp: prev.mrp,
          stock: "0",
          images: [],
        },
      ],
    }));
  }

  const err = (k: string) => errors[k] || undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!s.category) {
      setErrors({ category: "Select a category" });
      toast.error("Please choose a category");
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const body = toPayload(s);
      if (product) {
        const saved = await api<ProductDTO>(`/api/products/${product._id}`, { method: "PUT", body });
        const next = toState(saved);
        setInitial(next);
        setS(next);
        toast.success("Product saved");
        router.refresh();
      } else {
        const created = await api<ProductDTO>("/api/products", { method: "POST", body });
        toast.success("Product created", { description: created.name });
        router.push(`/admin/products/${created._id}`);
        router.refresh();
      }
    } catch (error) {
      const fields = notifyError(error, "Couldn't save product");
      setErrors(fields);
      const first = Object.keys(fields)[0];
      if (first) document.getElementById(`f-${first.split(".")[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection title="Basic information" description="What shoppers see first.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Product name" htmlFor="f-name" error={err("name")} required className="sm:col-span-2">
                <input
                  id="f-name"
                  className={adminInput}
                  value={s.name}
                  aria-invalid={!!err("name")}
                  onChange={(e) => {
                    const name = e.target.value;
                    setS((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
                  }}
                  placeholder="e.g. Lakshmi Temple Gold-Plated Haram"
                />
              </FormField>
              <FormField label="URL slug" htmlFor="f-slug" error={err("slug")} hint="Auto-generated from the name. Lowercase, dashes only." className="sm:col-span-2">
                <div className="flex items-center rounded-xl border border-input bg-ivory/60 focus-within:border-gold-400 focus-within:ring-4 focus-within:ring-gold-100">
                  <span className="pl-3.5 text-xs text-stone">/product/</span>
                  <input
                    id="f-slug"
                    className="h-10 flex-1 bg-transparent px-1 text-sm outline-none"
                    value={s.slug}
                    aria-invalid={!!err("slug")}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                    }}
                  />
                </div>
              </FormField>
              <FormField
                label="Short description"
                htmlFor="f-shortDescription"
                error={err("shortDescription")}
                className="sm:col-span-2"
                hint="Shown near the price. Max 300 characters."
              >
                <textarea
                  id="f-shortDescription"
                  className={cn(adminTextarea, "min-h-20")}
                  value={s.shortDescription}
                  maxLength={300}
                  onChange={(e) => set("shortDescription", e.target.value)}
                />
              </FormField>
              <FormField label="Full description" htmlFor="f-description" error={err("description")} className="sm:col-span-2">
                <textarea
                  id="f-description"
                  className={cn(adminTextarea, "min-h-40")}
                  value={s.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Craftsmanship, design story, styling notes…"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            id="f-images"
            title="Media"
            description="Drag to reorder. The main image is used on cards and in search."
            actions={<span className="text-xs tabular-nums text-stone">{s.images.length}/15</span>}
          >
            <ImageGallery images={s.images} onChange={(images) => set("images", images)} />
            {err("images") && <p className="mt-2 text-xs text-destructive">{err("images")}</p>}
          </FormSection>

          <FormSection title="Pricing & inventory">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Selling price (₹)" htmlFor="f-price" error={err("price")} required>
                <input
                  id="f-price"
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className={cn(adminInput, "tabular-nums")}
                  value={s.price}
                  aria-invalid={!!err("price")}
                  onChange={(e) => set("price", e.target.value)}
                />
              </FormField>
              <FormField label="MRP (₹)" htmlFor="f-mrp" error={err("mrp")} hint="Leave blank to match price">
                <input
                  id="f-mrp"
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className={cn(adminInput, "tabular-nums")}
                  value={s.mrp}
                  aria-invalid={!!err("mrp")}
                  onChange={(e) => set("mrp", e.target.value)}
                />
              </FormField>
              <FormField label="SKU" htmlFor="f-sku" error={err("sku")} required>
                <input
                  id="f-sku"
                  className={cn(adminInput, "font-mono uppercase")}
                  value={s.sku}
                  aria-invalid={!!err("sku")}
                  onChange={(e) => set("sku", e.target.value.toUpperCase())}
                  placeholder="SWN-NK-001"
                />
              </FormField>
              <FormField
                label="Stock"
                htmlFor="f-stock"
                error={err("stock")}
                hint={hasVariants ? "Sum of variant stock" : undefined}
              >
                <input
                  id="f-stock"
                  type="number"
                  min={0}
                  step={1}
                  className={cn(adminInput, "tabular-nums")}
                  value={hasVariants ? String(variantStock) : s.stock}
                  disabled={hasVariants}
                  onChange={(e) => set("stock", e.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-ivory px-4 py-3 text-sm">
              <span className="text-stone">Customer pays</span>
              <span className="font-semibold tabular-nums text-charcoal">{formatPrice(num(s.price))}</span>
              {discount > 0 ? (
                <motion.span
                  key={discount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-gold-gradient px-2.5 py-0.5 text-xs font-semibold text-charcoal"
                >
                  {discount}% off · saves {formatPrice(num(s.mrp) - num(s.price))}
                </motion.span>
              ) : (
                <span className="text-xs text-stone">No discount</span>
              )}
            </div>
          </FormSection>

          <FormSection
            id="f-variants"
            title="Variants"
            description="Optional — colours, sizes or finishes with their own SKU, price and stock."
            actions={
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-xs font-medium text-charcoal transition hover:border-gold-300 hover:text-gold-700"
              >
                <Plus className="size-3.5" /> Add variant
              </button>
            }
          >
            {err("variants") && <p className="mb-3 text-xs text-destructive">{err("variants")}</p>}
            {s.variants.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-stone">
                No variants. This product is sold as a single item.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {s.variants.map((v, i) => {
                    const open = openVariant === v.key;
                    const ve = (k: string) => errors[`variants.${i}.${k}`];
                    return (
                      <motion.li
                        key={v.key}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-border bg-ivory/40 p-3"
                      >
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.6fr_auto]">
                          <input
                            className={cn(adminInput, "col-span-2 md:col-span-1")}
                            placeholder="Name (e.g. Ruby red)"
                            value={v.name}
                            aria-invalid={!!ve("name")}
                            onChange={(e) => setVariant(v.key, { name: e.target.value })}
                            aria-label="Variant name"
                          />
                          <input
                            className={cn(adminInput, "font-mono uppercase")}
                            placeholder="SKU"
                            value={v.sku}
                            aria-invalid={!!ve("sku")}
                            onChange={(e) => setVariant(v.key, { sku: e.target.value.toUpperCase() })}
                            aria-label="Variant SKU"
                          />
                          <input
                            className={adminInput}
                            placeholder="Colour"
                            value={v.color}
                            onChange={(e) => setVariant(v.key, { color: e.target.value })}
                            aria-label="Variant colour"
                          />
                          <input
                            className={adminInput}
                            placeholder="Size"
                            value={v.size}
                            onChange={(e) => setVariant(v.key, { size: e.target.value })}
                            aria-label="Variant size"
                          />
                          <input
                            className={cn(adminInput, "tabular-nums")}
                            type="number"
                            min={0}
                            placeholder="Price"
                            value={v.price}
                            aria-invalid={!!ve("price")}
                            onChange={(e) => setVariant(v.key, { price: e.target.value })}
                            aria-label="Variant price"
                          />
                          <input
                            className={cn(adminInput, "tabular-nums")}
                            type="number"
                            min={0}
                            placeholder="MRP"
                            value={v.mrp}
                            aria-invalid={!!ve("mrp")}
                            onChange={(e) => setVariant(v.key, { mrp: e.target.value })}
                            aria-label="Variant MRP"
                          />
                          <input
                            className={cn(adminInput, "tabular-nums")}
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Stock"
                            value={v.stock}
                            aria-invalid={!!ve("stock")}
                            onChange={(e) => setVariant(v.key, { stock: e.target.value })}
                            aria-label="Variant stock"
                          />
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setOpenVariant(open ? null : v.key)}
                              className={cn(
                                "inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs text-stone transition hover:bg-white hover:text-charcoal",
                                open && "bg-white text-charcoal",
                              )}
                              aria-expanded={open}
                              aria-label="Variant images"
                            >
                              <ImageIcon className="size-3.5" />
                              {v.images.length || ""}
                              <ChevronDown className={cn("size-3.5 transition", open && "rotate-180")} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setS((prev) => ({ ...prev, variants: prev.variants.filter((x) => x.key !== v.key) }))}
                              className="grid size-9 place-items-center rounded-full text-stone transition hover:bg-rose-50 hover:text-rose-700"
                              aria-label="Remove variant"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                        {(ve("name") || ve("sku") || ve("price") || ve("mrp") || ve("stock")) && (
                          <p className="mt-2 text-xs text-destructive">
                            {ve("name") || ve("sku") || ve("price") || ve("mrp") || ve("stock")}
                          </p>
                        )}
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3">
                                <ImageGallery
                                  images={v.images}
                                  compact
                                  max={12}
                                  onChange={(images) => setVariant(v.key, { images })}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </FormSection>

          <FormSection title="Details" description="Attributes used for filters and the product specification table.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Jewellery type" htmlFor="f-jewelleryType" error={err("jewelleryType")}>
                <input
                  id="f-jewelleryType"
                  list="jewellery-types"
                  className={adminInput}
                  value={s.jewelleryType}
                  onChange={(e) => set("jewelleryType", e.target.value)}
                />
                <datalist id="jewellery-types">
                  {JEWELLERY_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </FormField>
              <FormField label="Material" htmlFor="f-material" error={err("material")}>
                <input
                  id="f-material"
                  className={adminInput}
                  value={s.material}
                  onChange={(e) => set("material", e.target.value)}
                  placeholder="Brass alloy, kemp stones"
                />
              </FormField>
              <FormField label="Plating" htmlFor="f-plating" error={err("plating")}>
                <input
                  id="f-plating"
                  list="platings"
                  className={adminInput}
                  value={s.plating}
                  onChange={(e) => set("plating", e.target.value)}
                />
                <datalist id="platings">
                  {PLATINGS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </FormField>
              <FormField label="Colour" htmlFor="f-color" error={err("color")}>
                <input id="f-color" className={adminInput} value={s.color} onChange={(e) => set("color", e.target.value)} />
              </FormField>
              <FormField label="Weight" htmlFor="f-weight" error={err("weight")}>
                <input
                  id="f-weight"
                  className={adminInput}
                  value={s.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="e.g. 45 g"
                />
              </FormField>
              <FormField label="Size" htmlFor="f-size" error={err("size")}>
                <input
                  id="f-size"
                  className={adminInput}
                  value={s.size}
                  onChange={(e) => set("size", e.target.value)}
                  placeholder="e.g. Adjustable / 2.6"
                />
              </FormField>
              <FormField label="Occasion" htmlFor="f-occasion" error={err("occasion")} className="sm:col-span-2 lg:col-span-3">
                <ChipsInput id="f-occasion" value={s.occasion} onChange={(v) => set("occasion", v)} suggestions={OCCASIONS} max={10} />
              </FormField>
              <FormField label="Tags" htmlFor="f-tags" error={err("tags")} hint="Improve search. Press Enter after each tag." className="sm:col-span-2 lg:col-span-3">
                <ChipsInput id="f-tags" value={s.tags} onChange={(v) => set("tags", v)} placeholder="temple, kemp, south indian…" />
              </FormField>
              <FormField label="Care instructions" htmlFor="f-care" error={err("careInstructions")} className="sm:col-span-2 lg:col-span-3">
                <textarea
                  id="f-care"
                  className={adminTextarea}
                  value={s.careInstructions}
                  onChange={(e) => set("careInstructions", e.target.value)}
                  placeholder="Store in a dry pouch. Avoid perfume and water…"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Search engine listing" description="Optional — defaults to the product name and short description.">
            <div className="mb-5 rounded-xl border border-border bg-ivory/60 p-4">
              <p className="truncate text-xs text-emerald-800">swarnika.in › product › {s.slug || "your-product"}</p>
              <p className="mt-0.5 truncate text-base text-sky-800">{s.seo.title || s.name || "Product title"}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-stone">
                {s.seo.description || s.shortDescription || "Your meta description will appear here."}
              </p>
            </div>
            <div className="grid gap-4">
              <FormField label="SEO title" htmlFor="f-seo" error={err("seo.title")}>
                <div className="relative">
                  <input
                    id="f-seo"
                    className={cn(adminInput, "pr-16")}
                    value={s.seo.title}
                    onChange={(e) => set("seo", { ...s.seo, title: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
                    <CharCount value={s.seo.title} max={70} />
                  </span>
                </div>
              </FormField>
              <FormField label="SEO description" htmlFor="f-seo-desc" error={err("seo.description")}>
                <div className="relative">
                  <textarea
                    id="f-seo-desc"
                    className={cn(adminTextarea, "min-h-20 pb-6")}
                    value={s.seo.description}
                    onChange={(e) => set("seo", { ...s.seo, description: e.target.value })}
                  />
                  <span className="absolute bottom-2 right-3 text-[11px]">
                    <CharCount value={s.seo.description} max={170} />
                  </span>
                </div>
              </FormField>
              <FormField label="Social share image (OG)" error={err("seo.ogImage")} hint="1200×630 recommended. Defaults to the main image.">
                <div className="max-w-sm">
                  <SingleImageField
                    value={s.seo.ogImage}
                    onChange={(ogImage) => set("seo", { ...s.seo, ogImage })}
                    aspect="aspect-[1200/630]"
                  />
                </div>
              </FormField>
            </div>
          </FormSection>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-28 xl:self-start">
          <FormSection title="Organisation">
            <div className="flex flex-col gap-4">
              <FormField label="Category" htmlFor="f-category" error={err("category")} required>
                <select
                  id="f-category"
                  className={adminSelect}
                  value={s.category}
                  aria-invalid={!!err("category")}
                  onChange={(e) => setS((prev) => ({ ...prev, category: e.target.value, subcategory: "" }))}
                >
                  <option value="">Select category…</option>
                  {parents.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {!c.isActive ? " (hidden)" : ""}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Subcategory" htmlFor="f-subcategory" error={err("subcategory")}>
                <select
                  id="f-subcategory"
                  className={adminSelect}
                  value={s.subcategory}
                  disabled={!s.category || subs.length === 0}
                  onChange={(e) => set("subcategory", e.target.value)}
                >
                  <option value="">{!s.category ? "Choose a category first" : subs.length ? "None" : "No subcategories"}</option>
                  {subs.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Visibility & badges">
            <div className="flex flex-col gap-2">
              <ToggleRow label="Active" description="Visible on the storefront" checked={s.isActive} onChange={(v) => set("isActive", v)} />
              <ToggleRow label="Featured" checked={s.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <ToggleRow label="Best seller" checked={s.isBestSeller} onChange={(v) => set("isBestSeller", v)} />
              <ToggleRow label="New arrival" checked={s.isNewArrival} onChange={(v) => set("isNewArrival", v)} />
              <ToggleRow label="Trending" checked={s.isTrending} onChange={(v) => set("isTrending", v)} />
            </div>
          </FormSection>

          {product && (
            <div className="rounded-2xl border border-border bg-white p-5 text-xs text-stone shadow-soft">
              <div className="flex justify-between py-1">
                <span>Units sold</span>
                <span className="font-semibold tabular-nums text-charcoal">{product.salesCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Rating</span>
                <span className="font-semibold tabular-nums text-charcoal">
                  {product.ratings.toFixed(1)} ({product.reviewCount})
                </span>
              </div>
              <Link
                href={`/product/${product.slug}`}
                target="_blank"
                className="mt-3 inline-flex items-center gap-1.5 font-medium text-gold-700 hover:underline"
              >
                View on store <ExternalLink className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-30 mt-6 rounded-2xl border border-border bg-white/90 shadow-lift backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <p className="flex items-center gap-2 text-xs text-stone">
            <span className={cn("size-2 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />
            {dirty ? "Unsaved changes" : product ? "All changes saved" : "New product"}
          </p>
          <div className="flex gap-2">
            <Link
              href="/admin/products"
              className="inline-flex h-10 items-center rounded-full border border-border bg-white px-5 text-sm font-medium text-charcoal transition hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || (!!product && !dirty)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-medium text-ivory shadow-soft transition hover:bg-gold-700 disabled:opacity-50"
            >
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
