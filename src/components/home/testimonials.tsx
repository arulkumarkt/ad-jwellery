"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { RatingStars } from "@/components/common/rating-stars";
import { EASE, SectionHeading } from "@/components/motion";
import type { SectionItemDTO } from "@/types";

export function Testimonials({ eyebrow, title, items }: { eyebrow: string; title: string; items: SectionItemDTO[] }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (items.length < 2 || reduce) return;
    const id = setTimeout(() => {
      setDir(1);
      setI((v) => (v + 1) % items.length);
    }, 6500);
    return () => clearTimeout(id);
  }, [i, items.length, reduce]);

  if (!items.length) return null;
  const t = items[i];
  const go = (d: 1 | -1) => {
    setDir(d);
    setI((v) => (v + d + items.length) % items.length);
  };

  return (
    <section className="relative overflow-hidden bg-charcoal py-20 text-ivory sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-0 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl" style={{ background: "var(--gradient-gold)" }} />
      <div className="container-lux relative">
        <SectionHeading eyebrow={eyebrow} title={title} className="[&_h2]:text-ivory [&_.eyebrow]:!text-gold-200" />
        <div className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto size-10 text-gold-400" strokeWidth={1.2} />
          <div className="relative mt-6 min-h-[220px] sm:min-h-[200px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.figure
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.55, ease: EASE }}
              >
                <blockquote className="font-display text-2xl leading-snug text-ivory/95 sm:text-[2rem]">“{t.text}”</blockquote>
                <figcaption className="mt-8 flex flex-col items-center gap-2">
                  {t.rating > 0 && <RatingStars value={t.rating} size={14} />}
                  <span className="text-sm font-semibold tracking-wide">{t.author}</span>
                  {t.meta && <span className="text-xs uppercase tracking-[0.2em] text-ivory/50">{t.meta}</span>}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={() => go(-1)} aria-label="Previous testimonial" className="grid size-11 place-items-center rounded-full border border-ivory/20 transition hover:border-gold-300 hover:text-gold-200">
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex gap-2">
              {items.map((_, k) => (
                <button
                  key={k}
                  onClick={() => {
                    setDir(k > i ? 1 : -1);
                    setI(k);
                  }}
                  aria-label={`Testimonial ${k + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? "w-8 bg-gold-400" : "w-1.5 bg-ivory/30"}`}
                />
              ))}
            </div>
            <button onClick={() => go(1)} aria-label="Next testimonial" className="grid size-11 place-items-center rounded-full border border-ivory/20 transition hover:border-gold-300 hover:text-gold-200">
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
