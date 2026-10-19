"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkle } from "lucide-react";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion";

const IMAGE =
  "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1200&q=80&auto=format&fit=crop";

const SPARKS = [
  { top: "14%", left: "12%", size: 14, delay: 0 },
  { top: "28%", left: "78%", size: 10, delay: 1.2 },
  { top: "62%", left: "18%", size: 12, delay: 0.6 },
  { top: "76%", left: "70%", size: 16, delay: 1.8 },
  { top: "46%", left: "88%", size: 8, delay: 2.4 },
];

/** Split-screen frame for sign-in / sign-up: editorial image left, form right. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  quote,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  quote: { text: string; author: string };
  children: ReactNode;
  footer: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <section className="container-lux py-6 sm:py-10 lg:py-14">
      <div className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft lg:grid-cols-[1.05fr_1fr]">
        {/* Visual panel */}
        <div className="relative hidden min-h-[640px] overflow-hidden bg-charcoal lg:block">
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
          >
            <Image src={IMAGE} alt="Gold-plated temple jewellery on silk" fill priority sizes="50vw" className="object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/35 to-charcoal/10" />

          {/* Decorative gold rings + sparkles */}
          <motion.div
            aria-hidden
            className="absolute -right-24 -top-24 size-80 rounded-full border border-gold-300/40"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300" />
          </motion.div>
          <motion.div
            aria-hidden
            className="absolute -bottom-32 -left-20 size-96 rounded-full border border-gold-200/25"
            animate={reduce ? undefined : { rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute bottom-6 right-16 size-1.5 rounded-full bg-gold-200" />
          </motion.div>
          {SPARKS.map((s, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute text-gold-200"
              style={{ top: s.top, left: s.left }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={reduce ? { opacity: 0.6, scale: 1 } : { opacity: [0, 0.9, 0], scale: [0.4, 1, 0.4], rotate: [0, 90] }}
              transition={reduce ? { duration: 0 } : { duration: 3.2, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkle style={{ width: s.size, height: s.size }} fill="currentColor" strokeWidth={0} />
            </motion.span>
          ))}

          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
              className="max-w-md"
            >
              <span className="eyebrow !text-gold-200">Swarnika · Est. with love</span>
              <blockquote className="mt-5 font-display text-3xl leading-[1.15] text-ivory xl:text-4xl">
                &ldquo;{quote.text}&rdquo;
              </blockquote>
              <p className="mt-4 text-sm text-ivory/70">— {quote.author}</p>
              <span className="hairline mt-8 block w-40" />
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.18em] text-ivory/70">
                <li>Anti-tarnish finish</li>
                <li>Free shipping</li>
                <li>Easy returns</li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 xl:px-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold-50/70 to-transparent lg:hidden"
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative mx-auto w-full max-w-md"
          >
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-3 text-4xl leading-tight text-charcoal sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-stone">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 border-t border-border pt-6 text-center text-sm text-stone">{footer}</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
