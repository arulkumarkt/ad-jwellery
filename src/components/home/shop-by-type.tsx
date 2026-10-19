"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EASE, SectionHeading } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types";

export function ShopByType({ eyebrow, title, subtitle, categories }: { eyebrow: string; title: string; subtitle?: string; categories: CategoryDTO[] }) {
  if (!categories.length) return null;
  return (
    <section className="bg-cream/60 py-16 sm:py-24">
      <div className="container-lux">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <motion.div
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {categories.map((c, i) => (
            <motion.div
              key={c._id}
              variants={{ hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}
              className={cn(i % 2 === 1 && "lg:mt-12")}
            >
              <Link href={`/category/${c.slug}`} className="group relative block overflow-hidden rounded-[1.75rem]">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={c.bannerImage || c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width:1024px) 25vw, 50vw"
                    className="object-cover transition duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-ivory sm:p-6">
                  <div>
                    <p className="font-display text-2xl leading-none sm:text-3xl">{c.name}</p>
                    <p className="mt-2 line-clamp-2 hidden text-xs text-ivory/75 sm:block">{c.description}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ivory/15 backdrop-blur transition duration-500 group-hover:rotate-45 group-hover:bg-gold-400 group-hover:text-charcoal">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
