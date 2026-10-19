"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Reveal } from "@/components/motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerDTO } from "@/types";

export function PromotionalBanner({ banner }: { banner: BannerDTO }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-12%", "12%"]);
  const dark = banner.theme === "dark";

  return (
    <section className="container-lux py-10 sm:py-16">
      <div ref={ref} className="relative isolate overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
        <motion.div style={{ y }} className="absolute inset-[-14%_0] -z-10">
          <Image src={banner.image} alt="" fill sizes="100vw" className="object-cover" />
        </motion.div>
        <div className={cn("absolute inset-0 -z-10", dark ? "bg-gradient-to-r from-charcoal/90 via-charcoal/60 to-charcoal/10" : "bg-gradient-to-r from-ivory/95 via-ivory/70 to-transparent")} />
        <div className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-gold-300/40 sm:inset-5 sm:rounded-[2rem]" aria-hidden />
        <div className={cn("relative max-w-xl px-7 py-16 sm:px-14 sm:py-24", dark ? "text-ivory" : "text-charcoal")}>
          <Reveal>
            {banner.eyebrow && <p className={cn("eyebrow", dark && "!text-gold-200")}>{banner.eyebrow}</p>}
            <h2 className="mt-4 text-balance text-4xl leading-[1.05] sm:text-6xl">{banner.title}</h2>
            {banner.subtitle && <p className={cn("mt-5 text-sm sm:text-base", dark ? "text-ivory/75" : "text-stone")}>{banner.subtitle}</p>}
            {banner.ctaLabel && banner.ctaHref && (
              <Link href={banner.ctaHref} className={cn(buttonVariants({ variant: dark ? "gold" : "default", size: "xl" }), "group mt-8")}>
                {banner.ctaLabel} <ArrowRight className="transition group-hover:translate-x-1" />
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
