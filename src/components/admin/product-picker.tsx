"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, LoaderCircle, Search, X } from "lucide-react";
import { api } from "@/lib/fetcher";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatPrice } from "@/lib/utils";
import type { Paginated, ProductDTO } from "@/types";
import { AdminImage } from "./admin-image";

export interface PickedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
}

/** Search the catalogue and pick an ordered set of products. */
export function ProductPicker({
  value,
  onChange,
  max = 24,
}: {
  value: PickedProduct[];
  onChange: (next: PickedProduct[]) => void;
  max?: number;
}) {
  const [q, setQ] = useState("");
  const term = useDebounce(q.trim(), 300);
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const data = await api<Paginated<ProductDTO>>(
          `/api/products?scope=admin&pageSize=8${term ? `&q=${encodeURIComponent(term)}` : ""}`,
          { signal: ctrl.signal },
        );
        setResults(
          data.items.map((p) => ({
            _id: p._id,
            name: p.name,
            image: p.images.find((i) => i.isMain)?.thumbnail || p.images[0]?.thumbnail || "",
            price: p.price,
          })),
        );
      } catch {
        /* aborted or failed — keep previous results */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => ctrl.abort();
  }, [term]);

  const selected = new Set(value.map((p) => p._id));

  function toggle(p: PickedProduct) {
    if (selected.has(p._id)) onChange(value.filter((v) => v._id !== p._id));
    else if (value.length < max) onChange([...value, p]);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-xl border border-input bg-white pl-9 pr-9 text-sm outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-100"
          />
          {loading && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gold-600" />}
        </div>
        <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-border">
          {results.map((p) => {
            const on = selected.has(p._id);
            return (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left transition last:border-0 hover:bg-gold-50/50",
                    on && "bg-gold-50",
                  )}
                >
                  <AdminImage src={p.image} alt="" className="size-9 shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-charcoal">{p.name}</span>
                    <span className="text-xs tabular-nums text-stone">{formatPrice(p.price)}</span>
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      on ? "border-gold-500 bg-gold-500 text-white" : "border-border",
                    )}
                  >
                    {on && <Check className="size-3" />}
                  </span>
                </button>
              </li>
            );
          })}
          {!loading && results.length === 0 && <li className="px-3 py-6 text-center text-xs text-stone">No products found.</li>}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs text-stone">
          {value.length ? `${value.length} selected (shown in this order)` : "None selected — products are chosen automatically."}
        </p>
        <ul className="space-y-1.5">
          {value.map((p, i) => (
            <li key={p._id} className="flex items-center gap-2 rounded-xl border border-border bg-ivory/50 px-2 py-1.5">
              <AdminImage src={p.image} alt="" className="size-8 shrink-0 rounded-md" />
              <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-6 place-items-center rounded text-stone hover:bg-white disabled:opacity-25" aria-label="Move up">
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                className="grid size-6 place-items-center rounded text-stone hover:bg-white disabled:opacity-25"
                aria-label="Move down"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <button type="button" onClick={() => toggle(p)} className="grid size-6 place-items-center rounded text-stone hover:bg-rose-50 hover:text-rose-700" aria-label="Remove">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
