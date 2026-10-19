"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, createElement, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";

interface CatalogParams {
  params: URLSearchParams;
  setParams: (patch: Record<string, string | null | undefined>, opts?: { resetPage?: boolean }) => void;
  clearAll: () => void;
  pending: boolean;
}

const CatalogContext = createContext<CatalogParams | null>(null);

/** Single source of truth for URL filters + one shared transition (so every control sees `pending`). */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setParams = useCallback<CatalogParams["setParams"]>(
    (patch, opts = { resetPage: true }) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (opts.resetPage !== false) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [search, pathname, router],
  );

  const clearAll = useCallback(() => {
    const keep = new URLSearchParams();
    const q = search.get("q");
    if (q) keep.set("q", q);
    const qs = keep.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }, [search, pathname, router]);

  const value = useMemo(
    () => ({ params: new URLSearchParams(search.toString()), setParams, clearAll, pending }),
    [search, setParams, clearAll, pending],
  );
  return createElement(CatalogContext.Provider, { value }, children);
}

export function useCatalogParams(): CatalogParams {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalogParams must be used inside <CatalogProvider>");
  return ctx;
}
