"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string } | ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className={cn("flex flex-col items-center justify-center px-6 py-16 text-center sm:py-24", className)}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="relative mb-6 grid size-20 place-items-center rounded-full bg-gold-50 ring-1 ring-gold-200"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-gold-100/60 [animation-duration:2.4s]" aria-hidden />
        <Icon className="relative size-8 text-gold-600" strokeWidth={1.4} />
      </motion.div>
      <h3 className="text-2xl text-charcoal sm:text-3xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-stone">{description}</p>}
      {action && (
        <div className="mt-6">
          {typeof action === "object" && action !== null && "href" in action && "label" in action ? (
            <Link
              href={action.href}
              className="inline-flex h-11 items-center rounded-full bg-charcoal px-7 text-sm font-medium text-ivory transition hover:bg-gold-700"
            >
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </motion.div>
  );
}
