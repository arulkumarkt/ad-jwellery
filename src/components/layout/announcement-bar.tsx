"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4500);
    return () => clearInterval(id);
  }, [messages.length]);

  if (!messages.length) return null;
  return (
    <div className="relative z-50 h-9 overflow-hidden bg-charcoal text-ivory">
      <div className="container-lux flex h-full items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] sm:text-xs"
          >
            <Sparkles className="size-3 text-gold-300" aria-hidden />
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
