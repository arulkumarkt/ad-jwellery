"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { EASE } from "@/components/motion";

const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 70 + (i % 3) * 22;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: 4 + (i % 4) * 2,
    delay: 0.55 + (i % 6) * 0.04,
    shape: i % 3 === 0 ? "star" : "dot",
  } as const;
});

/** Gold check mark that draws itself, with a burst of sparkles. */
export function SuccessCelebration({ pending = false }: { pending?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto grid size-36 place-items-center" aria-hidden>
      {!reduce && !pending &&
        PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1, 0.6], rotate: p.shape === "star" ? 180 : 0 }}
            transition={{ duration: 1.3, delay: p.delay, ease: EASE }}
          >
            {p.shape === "star" ? (
              <svg width={p.size * 2} height={p.size * 2} viewBox="0 0 24 24" className="-translate-x-1/2 -translate-y-1/2 fill-gold-400">
                <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
              </svg>
            ) : (
              <span className="block -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300" style={{ width: p.size, height: p.size }} />
            )}
          </motion.span>
        ))}
      <motion.div
        className="absolute inset-3 rounded-full bg-gold-50 ring-1 ring-gold-200"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 16 }}
      />
      {!reduce && (
        <motion.div
          className="absolute inset-3 rounded-full ring-2 ring-gold-300"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
        />
      )}
      {pending ? (
        <Clock className="relative size-12 text-gold-600" strokeWidth={1.4} />
      ) : (
        <svg viewBox="0 0 52 52" className="relative size-20">
          <defs>
            <linearGradient id="gold-check" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e9d29c" />
              <stop offset="50%" stopColor="#c99d4b" />
              <stop offset="100%" stopColor="#9c6f2c" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="url(#gold-check)"
            strokeWidth="2"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
          <motion.path
            d="M15 27l7.5 7.5L38 19"
            fill="none"
            stroke="url(#gold-check)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
          />
        </svg>
      )}
    </div>
  );
}
