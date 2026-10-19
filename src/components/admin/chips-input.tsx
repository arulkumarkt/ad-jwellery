"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export function ChipsInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions,
  max = 30,
  id,
  invalid,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
  id?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const unused = suggestions?.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())) ?? [];

  return (
    <div>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-white px-2 py-1.5 transition focus-within:border-gold-400 focus-within:ring-4 focus-within:ring-gold-100",
          invalid && "border-destructive",
        )}
      >
        <AnimatePresence initial={false}>
          {value.map((chip) => (
            <motion.span
              key={chip}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 rounded-full bg-gold-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-gold-700 ring-1 ring-gold-200"
            >
              {chip}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== chip))}
                className="grid size-4 place-items-center rounded-full hover:bg-gold-200"
                aria-label={`Remove ${chip}`}
              >
                <X className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length ? "" : placeholder}
          className="h-7 min-w-28 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-stone/60"
          disabled={value.length >= max}
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-stone transition hover:border-gold-300 hover:text-gold-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
