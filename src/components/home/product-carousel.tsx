"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EASE, SectionHeading } from "@/components/motion";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

export function ProductCarousel({
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: ProductCardDTO[];
  viewAllHref?: string;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (!products.length) return null;
  const arrow =
    "grid size-11 place-items-center rounded-full border border-border bg-card text-charcoal transition hover:border-charcoal hover:bg-charcoal hover:text-ivory disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container-lux">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align="left"
          action={
            <div className="flex items-center gap-3">
              {viewAllHref && (
                <Link href={viewAllHref} className="group mr-2 hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal hover:text-gold-700 sm:flex">
                  View all <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                </Link>
              )}
              <button className={arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label="Previous products">
                <ArrowLeft className="size-4" />
              </button>
              <button className={arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label="Next products">
                <ArrowRight className="size-4" />
              </button>
            </div>
          }
        />
      </div>
      <motion.div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 sm:scroll-px-6 pb-6 sm:gap-6 sm:px-6 lg:px-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {products.map((p) => (
          <motion.div
            key={p._id}
            className="w-[62%] shrink-0 snap-start sm:w-[38%] md:w-[30%] lg:w-[23%] xl:w-[19.5%]"
            variants={{ hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE } } }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
      {viewAllHref && (
        <div className="mt-4 flex justify-center sm:hidden">
          <Link href={viewAllHref} className="rounded-full border border-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
            View all
          </Link>
        </div>
      )}
    </section>
  );
}
