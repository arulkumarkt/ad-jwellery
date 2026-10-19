"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EASE } from "@/components/motion";
import type { CategoryDTO } from "@/types";

/** Desktop "Shop" dropdown: category columns + a featured visual. */
export function MegaMenu({ categories, onNavigate }: { categories: CategoryDTO[]; onNavigate: () => void }) {
  const featured = categories.find((c) => c.slug === "bridal-jewellery") ?? categories[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="absolute inset-x-0 top-full border-t border-border bg-ivory/95 shadow-lift backdrop-blur-xl"
    >
      <div className="container-lux grid grid-cols-12 gap-10 py-10">
        <div className="col-span-8 grid grid-cols-3 gap-x-8 gap-y-7">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i, duration: 0.35, ease: EASE }}
            >
              <Link
                href={`/category/${cat.slug}`}
                onClick={onNavigate}
                className="group inline-flex items-center gap-1 font-display text-lg text-charcoal transition hover:text-gold-600"
              >
                {cat.name}
                <ArrowUpRight className="size-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
              {cat.children && cat.children.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {cat.children.map((sub) => (
                    <li key={sub._id}>
                      <Link
                        href={`/category/${sub.slug}`}
                        onClick={onNavigate}
                        className="text-sm text-stone transition hover:text-charcoal"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
        {featured && (
          <Link
            href={`/category/${featured.slug}`}
            onClick={onNavigate}
            className="group relative col-span-4 overflow-hidden rounded-3xl"
          >
            <div className="relative aspect-[4/3] h-full w-full">
              <Image
                src={featured.bannerImage || featured.image}
                alt={featured.name}
                fill
                sizes="400px"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                <span className="eyebrow !text-gold-200">Featured</span>
                <p className="mt-1 font-display text-3xl">{featured.name}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm text-ivory/80">
                  Explore the edit <ArrowUpRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
