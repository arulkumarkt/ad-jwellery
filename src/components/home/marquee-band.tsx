"use client";

import { useReducedMotion } from "framer-motion";

const WORDS = ["Anti-tarnish plating", "Skin friendly", "Handcrafted in India", "Free shipping over ₹999", "Easy 7-day returns", "Cash on delivery"];

export function MarqueeBand() {
  const reduce = useReducedMotion();
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative overflow-hidden border-y border-gold-200/70 bg-cream/70 py-4" aria-hidden>
      <div
        className="flex w-max gap-10 whitespace-nowrap"
        style={{ animation: reduce ? undefined : "marquee 38s linear infinite" }}
      >
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-xl italic text-charcoal/80 sm:text-2xl">
            {w}
            <svg viewBox="0 0 24 24" className="size-3 text-gold-500">
              <path fill="currentColor" d="M12 0c.5 5.6 2.4 8.9 12 12-9.6 3.1-11.5 6.4-12 12-.5-5.6-2.4-8.9-12-12C9.6 8.9 11.5 5.6 12 0z" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
