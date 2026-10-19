"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared easing + timing so every animation on the site feels related. */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DURATION = { fast: 0.25, base: 0.6, slow: 0.9 } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
};

type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number; once?: boolean; amount?: number };

/** Fades and lifts its children into view as they scroll on screen. */
export function Reveal({ delay = 0, y = 24, once = true, amount = 0.2, children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: DURATION.base, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = HTMLMotionProps<"div"> & { stagger?: number; delay?: number; amount?: number };

/** Parent that staggers `StaggerItem` children when scrolled into view. */
export function Stagger({ stagger = 0.08, delay = 0, amount = 0.15, children, ...rest }: StaggerProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={fadeUp} {...rest}>
      {children}
    </motion.div>
  );
}

/** Curtain-style image reveal (clip-path) with a gentle scale settle. */
export function ImageReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left";
}) {
  const reduce = useReducedMotion();
  const hidden = direction === "up" ? "inset(100% 0% 0% 0%)" : "inset(0% 100% 0% 0%)";
  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial={reduce ? false : { clipPath: hidden }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: DURATION.slow + 0.2, ease: EASE, delay }}
    >
      <motion.div
        className="h-full w-full"
        initial={reduce ? false : { scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.4, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Moves children slower/faster than the scroll for depth. */
export function Parallax({ children, offset = 60, className }: { children: ReactNode; offset?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-offset, offset]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/** Section heading with eyebrow + title, animated consistently everywhere. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "mb-8 flex flex-col gap-3 md:mb-12",
        align === "center" ? "items-center text-center" : "items-start md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="text-balance text-3xl leading-[1.1] text-charcoal sm:text-4xl lg:text-5xl">{title}</h2>
        {align === "center" && <span className="hairline mt-1 w-24" aria-hidden />}
        {subtitle && <p className="max-w-xl text-pretty text-sm text-stone sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </Reveal>
  );
}
