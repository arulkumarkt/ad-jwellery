"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/** Debounced search box that syncs to `?q=` (resetting pagination). */
export function SearchInput({
  placeholder = "Search…",
  param = "q",
  className,
}: {
  placeholder?: string;
  param?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get(param) ?? "";
  const [value, setValue] = useState(initial);
  const debounced = useDebounce(value, 350);
  const [pending, startTransition] = useTransition();
  const lastPushed = useRef(initial);

  useEffect(() => {
    const term = debounced.trim();
    if (term === lastPushed.current) return;
    lastPushed.current = term;
    const next = new URLSearchParams(params.toString());
    if (term) next.set(param, term);
    else next.delete(param);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }, [debounced, param, params, pathname, router]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-full border border-input bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-stone/60 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {pending ? (
          <LoaderCircle className="size-4 animate-spin text-gold-600" />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="grid size-5 place-items-center rounded-full text-stone hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
