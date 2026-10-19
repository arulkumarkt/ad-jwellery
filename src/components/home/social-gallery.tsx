"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { EASE, SectionHeading } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { SectionItemDTO } from "@/types";

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function SocialGallery({ eyebrow, title, subtitle, items }: { eyebrow: string; title: string; subtitle?: string; items: SectionItemDTO[] }) {
  const images = items.filter((i) => i.image);
  if (!images.length) return null;
  return (
    <section className="py-16 sm:py-24">
      <div className="container-lux">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      </div>
      <motion.ul
        className="grid grid-cols-3 gap-1.5 px-1.5 sm:gap-3 sm:px-3 lg:grid-cols-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {images.slice(0, 12).map((item, i) => (
          <motion.li
            key={`${item.image}-${i}`}
            variants={{ hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } } }}
            className={cn(i % 2 === 1 && "lg:translate-y-8")}
          >
            <a
              href={item.href || "#"}
              target={item.href ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="group relative block aspect-square overflow-hidden rounded-xl sm:rounded-2xl"
              aria-label="Open on Instagram"
            >
              <Image src={item.image} alt={item.title || "Customer styling photo"} fill sizes="(min-width:1024px) 16vw, 33vw" className="object-cover transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 grid place-items-center bg-charcoal/0 text-ivory opacity-0 transition duration-500 group-hover:bg-charcoal/40 group-hover:opacity-100">
                <InstagramGlyph />
              </span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
