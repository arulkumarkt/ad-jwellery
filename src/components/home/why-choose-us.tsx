"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Gem, Gift, RefreshCcw, ShieldCheck, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { EASE, SectionHeading } from "@/components/motion";
import type { SectionItemDTO } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  truck: Truck,
  refresh: RefreshCcw,
  gem: Gem,
  gift: Gift,
  badge: BadgeCheck,
};

export function WhyChooseUs({ eyebrow, title, subtitle, items }: { eyebrow: string; title: string; subtitle?: string; items: SectionItemDTO[] }) {
  if (!items.length) return null;
  return (
    <section className="container-lux py-16 sm:py-24">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <motion.ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? Gem;
          return (
            <motion.li
              key={item.title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 transition-shadow duration-500 hover:shadow-lift"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gold-100/0 blur-2xl transition duration-700 group-hover:bg-gold-100/80" />
              <span className="relative grid size-14 place-items-center rounded-2xl bg-gold-50 ring-1 ring-gold-200 transition duration-500 group-hover:bg-gold-gradient group-hover:ring-0">
                <Icon className="size-6 text-gold-600 transition group-hover:text-charcoal" strokeWidth={1.5} />
              </span>
              <h3 className="relative mt-6 text-2xl leading-tight">{item.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-stone">{item.text}</p>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
