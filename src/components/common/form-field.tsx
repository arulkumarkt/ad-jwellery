import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Label + control + animated error message. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-[0.12em] text-stone">
        {label}
        {required && <span className="text-gold-600"> *</span>}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-destructive"
            role="alert"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className="text-xs text-stone/80">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Premium-styled native input classes shared by storefront forms. */
export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-charcoal outline-none transition placeholder:text-stone/60 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 aria-invalid:border-destructive aria-invalid:ring-destructive/10 disabled:opacity-60";
