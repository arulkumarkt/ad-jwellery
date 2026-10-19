"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerDTO } from "@/types";

const SLIDE_MS = 7000;

function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={cn("absolute text-gold-400", className)}
      initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
      animate={{ opacity: [0, 1, 0.5, 1], scale: [0.4, 1, 0.85, 1], rotate: [-30, 0, 15, 0] }}
      transition={{ duration: 4, delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      aria-hidden
    >
      <path fill="currentColor" d="M12 0c.5 5.6 2.4 8.9 12 12-9.6 3.1-11.5 6.4-12 12-.5-5.6-2.4-8.9-12-12C9.6 8.9 11.5 5.6 12 0z" />
    </motion.svg>
  );
}

function SplitWords({ text, delay = 0 }: { text: string; delay?: number }) {
  // Italicise and gild the last two words for an editorial headline.
  const words = text.split(" ");
  const accentFrom = Math.max(1, words.length - 2);
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={cn("inline-block", i >= accentFrom && "text-gold-gradient italic")}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "-110%" }}
            transition={{ duration: 0.85, ease: EASE, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </>
  );
}

export function HeroSection({ banners }: { banners: BannerDTO[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 120]);
  const orbY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 60]);

  useEffect(() => {
    if (banners.length < 2 || paused || reduce) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % banners.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [index, banners.length, paused, reduce]);

  if (!banners.length) return null;
  const b = banners[index];
  const accent = banners[(index + 1) % banners.length];

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Animated background */}
      <motion.div style={{ y: orbY }} className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <motion.div
          className="absolute -left-32 top-10 size-[420px] rounded-full bg-gold-100/70 blur-3xl"
          animate={reduce ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-20 bottom-0 size-[520px] rounded-full bg-blush/80 blur-3xl"
          animate={reduce ? undefined : { x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden>
          <defs>
            <pattern id="hero-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="var(--gold-200)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
      </motion.div>

      <div className="container-lux grid items-center gap-10 pb-16 pt-8 sm:pt-12 lg:min-h-[calc(100svh-7.25rem)] lg:grid-cols-12 lg:gap-6 lg:pb-20">
        {/* Copy */}
        <motion.div style={{ y: textY }} className="order-2 lg:order-1 lg:col-span-6 lg:pr-6">
          <AnimatePresence mode="wait">
            <motion.div key={b._id} initial="in" animate="in" exit="out">
              {b.eyebrow && (
                <motion.p
                  className="eyebrow flex items-center gap-2"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <span className="h-px w-8 bg-gold-400" /> {b.eyebrow}
                </motion.p>
              )}
              <h1 className="mt-5 text-balance text-[2.6rem] leading-[1.02] text-charcoal sm:text-6xl xl:text-[5.2rem]">
                <SplitWords text={b.title} delay={0.1} />
              </h1>
              {b.subtitle && (
                <motion.p
                  className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-stone sm:text-lg"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
                >
                  {b.subtitle}
                </motion.p>
              )}
              <motion.div
                className="mt-9 flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
              >
                {b.ctaLabel && b.ctaHref && (
                  <Link href={b.ctaHref} className={cn(buttonVariants({ size: "xl" }), "group")}>
                    {b.ctaLabel}
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
                {b.secondaryCtaLabel && b.secondaryCtaHref && (
                  <Link href={b.secondaryCtaHref} className={cn(buttonVariants({ variant: "outline", size: "xl" }), "bg-transparent")}>
                    {b.secondaryCtaLabel}
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <motion.ul
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-stone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <li className="flex items-center gap-2"><Sparkles className="size-4 text-gold-500" /> Anti-tarnish plating</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-gold-500" /> Skin-friendly</li>
            <li className="flex items-center gap-2"><Truck className="size-4 text-gold-500" /> Free shipping ₹999+</li>
          </motion.ul>

          {banners.length > 1 && (
            <div className="mt-10 flex items-center gap-3" role="tablist" aria-label="Choose slide">
              {banners.map((s, i) => (
                <button
                  key={s._id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}: ${s.title}`}
                  onClick={() => setIndex(i)}
                  className="group relative h-1 w-14 overflow-hidden rounded-full bg-charcoal/10"
                >
                  {i === index && (
                    <motion.span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-charcoal"
                      initial={{ width: paused || reduce ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused || reduce ? 0 : SLIDE_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Visual */}
        <div className="relative order-1 mx-auto w-full max-w-md sm:max-w-lg lg:order-2 lg:col-span-6 lg:max-w-none">
          <motion.div style={{ y: imageY }} className="relative ml-auto aspect-[4/5] w-[86%] lg:w-[78%]">
            <motion.div
              className="absolute -inset-3 rounded-t-full border border-gold-300/70"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
              aria-hidden
            />
            <div className="relative h-full w-full overflow-hidden rounded-t-full bg-cream shadow-lift">
              <AnimatePresence initial={false}>
                <motion.div
                  key={b._id}
                  className="absolute inset-0"
                  initial={{ clipPath: "inset(100% 0 0 0)" }}
                  animate={{ clipPath: "inset(0% 0 0 0)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: EASE }}
                >
                  <motion.div
                    className="h-full w-full"
                    initial={{ scale: 1.18 }}
                    animate={{ scale: reduce ? 1.02 : 1.06 }}
                    transition={{ duration: SLIDE_MS / 1000 + 1.5, ease: "easeOut" }}
                  >
                    <Image
                      src={b.image}
                      alt={b.title}
                      fill
                      priority={index === 0}
                      sizes="(min-width:1024px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Floating accent image */}
          {accent && accent._id !== b._id && (
            <motion.div
              className="absolute -left-1 bottom-10 aspect-square w-[34%] overflow-hidden rounded-full border-[6px] border-ivory shadow-lift sm:left-0 lg:-left-4"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, y: reduce ? 0 : [0, -10, 0] }}
              transition={{ opacity: { delay: 0.6 }, scale: { delay: 0.6, duration: 0.8, ease: EASE }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
            >
              <Image src={accent.image} alt="" fill sizes="200px" className="object-cover" />
            </motion.div>
          )}

          {/* Glass rating card */}
          <motion.div
            className="glass absolute right-0 top-[12%] rounded-2xl px-4 py-3 shadow-soft sm:-right-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, y: reduce ? 0 : [0, 8, 0] }}
            transition={{ opacity: { delay: 0.9 }, x: { delay: 0.9, duration: 0.8, ease: EASE }, y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 } }}
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-gold-400 text-gold-400" />
              ))}
            </div>
            <p className="mt-1 text-xs font-semibold text-charcoal">4.8 · 12,000+ happy customers</p>
          </motion.div>

          <motion.div
            className="absolute -right-6 bottom-24 hidden size-28 rounded-full border border-gold-300/60 lg:block"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-gold-400" />
          </motion.div>
          <Sparkle className="left-[8%] top-[6%] size-6" />
          <Sparkle className="right-[8%] bottom-[8%] size-4" delay={1.2} />
          <Sparkle className="left-[30%] top-[-2%] size-3" delay={2.1} />
        </div>
      </div>
    </section>
  );
}
