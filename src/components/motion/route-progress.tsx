"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Thin gold bar that sweeps across the top on every route change. */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [key, setKey] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey((k) => k + 1);
  }, [pathname, search]);

  return (
    <AnimatePresence>
      {key > 0 && (
        <motion.div
          key={key}
          className="bg-gold-gradient pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], times: [0, 0.7, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
