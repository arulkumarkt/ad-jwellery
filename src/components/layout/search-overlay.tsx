"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Loader2, Search, SearchX, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useLockBody } from "@/hooks/use-lock-body";
import { EASE } from "@/components/motion";
import { PriceDisplay } from "@/components/common/price-display";
import { useStore } from "@/components/providers/store-provider";
import { api } from "@/lib/fetcher";
import type { SearchSuggestionsDTO } from "@/types";

const RECENT_KEY = "sw_recent_searches";
const TRENDING = ["Jhumka", "Temple haram", "Bridal set", "Bangles", "Choker", "Pearl", "Rose gold"];

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [recentVersion, setRecentVersion] = useState(0);
  const [fetched, setFetched] = useState<{ q: string; data: SearchSuggestionsDTO } | null>(null);
  const debounced = useDebounce(q.trim(), 220);
  useLockBody(searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSearch();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    if (debounced.length < 2) return;
    const ctrl = new AbortController();
    api<SearchSuggestionsDTO>(`/api/search?q=${encodeURIComponent(debounced)}`, { signal: ctrl.signal })
      .then((data) => setFetched({ q: debounced, data }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced]);

  // Derived instead of stored: avoids extra renders and stale flags.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recent = useMemo(() => (searchOpen ? readRecent() : []), [searchOpen, recentVersion]);
  const result = debounced.length >= 2 && fetched ? fetched.data : null;
  const loading = q.trim().length >= 2 && fetched?.q !== q.trim();

  const go = (term: string) => {
    const t = term.trim();
    if (!t) return;
    saveRecent(t);
    closeSearch();
    setQ("");
    router.push(`/products?q=${encodeURIComponent(t)}`);
  };

  const pick = (term: string) => {
    setQ(term);
    inputRef.current?.focus();
  };

  const onNavigate = () => {
    if (q.trim()) saveRecent(q.trim());
    closeSearch();
    setQ("");
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
          />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative flex max-h-[100dvh] flex-col overflow-hidden rounded-b-[2rem] bg-ivory shadow-lift"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
              className="container-lux flex items-center gap-3 border-b border-border py-4 sm:py-6"
            >
              <Search className="size-5 shrink-0 text-gold-600" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search jhumkas, harams, bangles…"
                className="h-12 flex-1 bg-transparent font-display text-2xl text-charcoal outline-none placeholder:text-stone/50 sm:text-4xl"
                aria-label="Search products"
                enterKeyHint="search"
              />
              {loading && <Loader2 className="size-5 animate-spin text-gold-500" />}
              {q && !loading && (
                <button type="button" onClick={() => setQ("")} className="text-xs uppercase tracking-widest text-stone hover:text-charcoal">
                  Clear
                </button>
              )}
              <button type="button" onClick={closeSearch} aria-label="Close search" className="grid size-10 place-items-center rounded-full transition hover:rotate-90 hover:bg-cream">
                <X className="size-5" />
              </button>
            </form>

            <div className="container-lux overflow-y-auto py-6 sm:py-8">
              {debounced.length < 2 ? (
                <div className="grid gap-8 sm:grid-cols-2">
                  {recent.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="eyebrow">Recent searches</p>
                        <button
                          onClick={() => {
                            try {
                              localStorage.removeItem(RECENT_KEY);
                            } catch {}
                            setRecentVersion((v) => v + 1);
                          }}
                          className="text-xs text-stone hover:text-charcoal"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {recent.map((t) => (
                          <li key={t}>
                            <button onClick={() => pick(t)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream">
                              <Clock className="size-4 text-stone" /> {t}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="eyebrow mb-3">Trending now</p>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING.map((t, i) => (
                        <motion.button
                          key={t}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.04 }}
                          onClick={() => pick(t)}
                          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:border-gold-300 hover:bg-gold-50"
                        >
                          <TrendingUp className="size-3.5 text-gold-500" /> {t}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : result && result.total === 0 && result.categories.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-10 text-center">
                  <SearchX className="mb-4 size-10 text-gold-400" strokeWidth={1.3} />
                  <p className="font-display text-2xl">No matches for “{debounced}”</p>
                  <p className="mt-2 text-sm text-stone">Try a different spelling or explore a trending search.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {TRENDING.slice(0, 4).map((t) => (
                      <button key={t} onClick={() => pick(t)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-gold-50">
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : result ? (
                <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                  <div>
                    {result.categories.length > 0 && (
                      <>
                        <p className="eyebrow mb-3">Categories</p>
                        <ul className="space-y-1">
                          {result.categories.map((c) => (
                            <li key={c._id}>
                              <Link href={`/category/${c.slug}`} onClick={onNavigate} className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-cream">
                                {c.name}
                                <ArrowRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="eyebrow">Products</p>
                      {result.total > 0 && (
                        <button onClick={() => go(debounced)} className="group flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-charcoal hover:text-gold-700">
                          View all {result.total} <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                    <motion.ul
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                      initial="hidden"
                      animate="show"
                      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                    >
                      {result.products.map((p) => (
                        <motion.li key={p._id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                          <Link href={`/product/${p.slug}`} onClick={onNavigate} className="group flex gap-3 rounded-2xl p-2 transition hover:bg-card hover:shadow-soft">
                            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                              {p.image && (
                                <Image src={p.image.thumbnail} alt={p.image.alt || p.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-110" />
                              )}
                            </div>
                            <div className="min-w-0 py-1">
                              <p className="line-clamp-2 text-sm leading-snug">{p.name}</p>
                              <PriceDisplay price={p.price} mrp={p.mrp} size="sm" showBadge={false} className="mt-1" />
                            </div>
                          </Link>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
