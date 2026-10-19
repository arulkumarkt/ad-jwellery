"use client";

import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

/** Global client providers shared by storefront and admin. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border-gold-200 !bg-charcoal !text-ivory !shadow-lift !font-sans",
            description: "!text-ivory/70",
            actionButton: "!bg-gold-400 !text-charcoal",
          },
        }}
      />
    </MotionConfig>
  );
}
