"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE, SectionHeading } from "@/components/motion";
import type { CategoryDTO } from "@/types";

export function FeaturedCategories({
  eyebrow,
  title,
  subtitle,
  categories,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  categories: CategoryDTO[];
}) {
  if (!categories.length) return null;
  return (
    <section className="container-lux py-16 sm:py-24">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <motion.ul
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-8"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      >
        {categories.map((c) => (
          <motion.li
            key={c._id}
            className="w-[38%] shrink-0 snap-start sm:w-auto"
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
          >
            <Link href={`/category/${c.slug}`} className="group flex flex-col items-center text-center">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full bg-cream ring-1 ring-gold-200/60 transition duration-500 group-hover:shadow-lift group-hover:ring-gold-300">
                {c.image && (
                  <Image src={c.image} alt={c.name} fill sizes="(min-width:1024px) 12vw, 40vw" className="object-cover transition duration-700 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-3 font-display text-lg leading-tight text-charcoal transition group-hover:text-gold-700">{c.name}</p>
              {typeof c.productCount === "number" && <p className="text-[11px] uppercase tracking-[0.18em] text-stone">{c.productCount} pieces</p>}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
