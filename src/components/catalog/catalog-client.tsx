"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLockBody } from "@/hooks/use-lock-body";
import { EASE } from "@/components/motion";
import { cn, formatPrice } from "@/lib/utils";
import type { CategoryDTO, FacetsDTO, ProductSort } from "@/types";
import { useCatalogParams } from "./use-catalog-params";

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
];

const BADGES = [
  { value: "new", label: "New Arrivals" },
  { value: "bestseller", label: "Best Sellers" },
  { value: "trending", label: "Trending" },
  { value: "sale", label: "On Sale" },
];

/** Dims results while a filter navigation is in flight. */
export function CatalogResults({ children }: { children: ReactNode }) {
  const { pending } = useCatalogParams();
  return (
    <div className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-50")} aria-busy={pending}>
      {children}
    </div>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left" aria-expanded={open}>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal">{title}</span>
        <ChevronDown className={cn("size-4 text-stone transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({ checked, label, onClick, count }: { checked: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-3 py-1.5 text-left text-sm" aria-pressed={checked}>
      <span className={cn("grid size-[18px] place-items-center rounded-md border transition", checked ? "border-charcoal bg-charcoal text-ivory" : "border-input group-hover:border-gold-400")}>
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className={cn("flex-1", checked ? "text-charcoal" : "text-stone group-hover:text-charcoal")}>{label}</span>
      {count !== undefined && <span className="text-xs text-stone/70">{count}</span>}
    </button>
  );
}

function PriceFilter({ facets }: { facets: FacetsDTO }) {
  const { params, setParams } = useCatalogParams();
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  const presets = [
    { label: "Under ₹500", min: "", max: "500" },
    { label: "₹500 – ₹1,000", min: "500", max: "1000" },
    { label: "₹1,000 – ₹2,500", min: "1000", max: "2500" },
    { label: "Above ₹2,500", min: "2500", max: "" },
  ];
  const input = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-gold-400";
  return (
    <div className="space-y-3">
      {presets.map((p) => {
        const active = (params.get("minPrice") ?? "") === p.min && (params.get("maxPrice") ?? "") === p.max;
        return (
          <CheckRow
            key={p.label}
            label={p.label}
            checked={active}
            onClick={() => setParams(active ? { minPrice: null, maxPrice: null } : { minPrice: p.min, maxPrice: p.max })}
          />
        );
      })}
      <form
        className="flex items-center gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ minPrice: min, maxPrice: max });
        }}
      >
        <input className={input} inputMode="numeric" placeholder={`Min ${formatPrice(facets.priceRange.min)}`} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} aria-label="Minimum price" />
        <span className="text-stone">–</span>
        <input className={input} inputMode="numeric" placeholder={`Max ${formatPrice(facets.priceRange.max)}`} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} aria-label="Maximum price" />
        <button type="submit" className="h-10 shrink-0 rounded-xl bg-charcoal px-3 text-xs font-semibold text-ivory">Go</button>
      </form>
    </div>
  );
}

export function FilterPanel({
  categories,
  facets,
  activeCategory,
  baseCategory,
  showCategories = true,
}: {
  categories: CategoryDTO[];
  facets: FacetsDTO;
  activeCategory?: string;
  showCategories?: boolean;
  /** When rendered on a category page, the category whose children are offered as subcategory filters. */
  baseCategory?: CategoryDTO | null;
}) {
  const { params, setParams } = useCatalogParams();
  const badge = params.get("badge");
  const inStock = params.get("inStock") === "1";
  const plating = params.get("plating");
  const sub = params.get("subcategory");

  return (
    <div>
      {baseCategory?.children && baseCategory.children.length > 0 ? (
        <Section title="Type">
          {baseCategory.children.map((c) => (
            <CheckRow key={c._id} label={c.name} count={c.productCount} checked={sub === c.slug} onClick={() => setParams({ subcategory: sub === c.slug ? null : c.slug })} />
          ))}
        </Section>
      ) : showCategories ? (
        <Section title="Category">
          <div className="space-y-0.5">
            {categories.map((c) => (
              <CheckRow
                key={c._id}
                label={c.name}
                count={c.productCount}
                checked={activeCategory === c.slug}
                onClick={() => setParams({ category: activeCategory === c.slug ? null : c.slug, subcategory: null })}
              />
            ))}
          </div>
        </Section>
      ) : null}
      <Section title="Price">
        <PriceFilter key={`${params.get("minPrice")}-${params.get("maxPrice")}`} facets={facets} />
      </Section>
      <Section title="Availability">
        <CheckRow label="In stock only" checked={inStock} onClick={() => setParams({ inStock: inStock ? null : "1" })} />
      </Section>
      <Section title="Collections">
        {BADGES.map((b) => (
          <CheckRow key={b.value} label={b.label} checked={badge === b.value} onClick={() => setParams({ badge: badge === b.value ? null : b.value })} />
        ))}
      </Section>
      {facets.platings.length > 0 && (
        <Section title="Plating" defaultOpen={false}>
          {facets.platings.map((p) => (
            <CheckRow key={p} label={p} checked={plating === p} onClick={() => setParams({ plating: plating === p ? null : p })} />
          ))}
        </Section>
      )}
    </div>
  );
}

export function SortSelect() {
  const { params, setParams } = useCatalogParams();
  const value = (params.get("sort") as ProductSort | null) ?? "featured";
  return (
    <label className="relative flex items-center gap-2 text-sm">
      <span className="hidden text-stone sm:inline">Sort by</span>
      <select
        value={value}
        onChange={(e) => setParams({ sort: e.target.value === "featured" ? null : e.target.value })}
        className="h-10 cursor-pointer appearance-none rounded-full border border-border bg-card pl-4 pr-9 text-sm font-medium outline-none transition hover:border-gold-300 focus:border-gold-400"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-stone" />
    </label>
  );
}

export function MobileFilters(props: Parameters<typeof FilterPanel>[0] & { activeCount: number; total: number }) {
  const [open, setOpen] = useState(false);
  useLockBody(open);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium lg:hidden">
        <SlidersHorizontal className="size-4" /> Filters
        {props.activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-gold-500 text-[10px] text-white">{props.activeCount}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.45, ease: EASE }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, i) => i.offset.y > 120 && setOpen(false)}
              className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[2rem] bg-ivory"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-sand" />
              <div className="flex items-center justify-between px-6 pb-2 pt-4">
                <h2 className="text-2xl">Filters</h2>
                <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-cream" aria-label="Close filters">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <FilterPanel {...props} />
              </div>
              <div className="border-t border-border p-4">
                <button onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-charcoal text-sm font-medium text-ivory">
                  Show {props.total} results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ActiveFilterChips({ categories }: { categories: CategoryDTO[] }) {
  const { params, setParams, clearAll } = useCatalogParams();
  const chips: { key: string; label: string; patch: Record<string, null> }[] = [];
  const cat = params.get("category");
  if (cat) chips.push({ key: "category", label: categories.find((c) => c.slug === cat)?.name ?? cat, patch: { category: null } });
  const sub = params.get("subcategory");
  if (sub) chips.push({ key: "subcategory", label: sub.replace(/-/g, " "), patch: { subcategory: null } });
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  if (min || max) chips.push({ key: "price", label: `${min ? formatPrice(+min) : "₹0"} – ${max ? formatPrice(+max) : "Any"}`, patch: { minPrice: null, maxPrice: null } });
  if (params.get("inStock") === "1") chips.push({ key: "stock", label: "In stock", patch: { inStock: null } });
  const badge = params.get("badge");
  if (badge) chips.push({ key: "badge", label: BADGES.find((b) => b.value === badge)?.label ?? badge, patch: { badge: null } });
  const plating = params.get("plating");
  if (plating) chips.push({ key: "plating", label: plating, patch: { plating: null } });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence>
        {chips.map((c) => (
          <motion.button
            key={c.key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setParams(c.patch)}
            className="flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1.5 text-xs capitalize text-ivory"
          >
            {c.label} <X className="size-3" />
          </motion.button>
        ))}
      </AnimatePresence>
      <button onClick={clearAll} className="text-xs font-medium text-stone underline-offset-4 hover:text-charcoal hover:underline">
        Clear all
      </button>
    </div>
  );
}

export function SubcategoryPills({ base, active }: { base: CategoryDTO; active?: string | null }) {
  if (!base.children?.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <Link
        href={`/category/${base.slug}`}
        className={cn("shrink-0 rounded-full border px-4 py-2 text-sm transition", !active ? "border-charcoal bg-charcoal text-ivory" : "border-border bg-card hover:border-gold-300")}
      >
        All {base.name}
      </Link>
      {base.children.map((c) => (
        <Link
          key={c._id}
          href={`/category/${c.slug}`}
          className={cn("shrink-0 rounded-full border px-4 py-2 text-sm transition", active === c.slug ? "border-charcoal bg-charcoal text-ivory" : "border-border bg-card hover:border-gold-300")}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
