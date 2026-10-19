"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Package, User, X } from "lucide-react";
import { useState } from "react";
import { useLockBody } from "@/hooks/use-lock-body";
import { EASE } from "@/components/motion";
import { Logo } from "@/components/common/logo";
import { useStore } from "@/components/providers/store-provider";
import type { CategoryDTO } from "@/types";
import type { NavLink } from "./nav-data";

export function MobileNav({
  open,
  onClose,
  categories,
  links,
  logoText,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
  links: NavLink[];
  logoText: string;
}) {
  useLockBody(open);
  const { customer } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.45, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.4, right: 0 }}
            onDragEnd={(_, info) => info.offset.x < -80 && onClose()}
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-ivory shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Logo text={logoText} className="!items-start" />
              <button onClick={onClose} aria-label="Close menu" className="grid size-10 place-items-center rounded-full hover:bg-cream">
                <X className="size-5" />
              </button>
            </div>

            <motion.nav
              className="flex-1 overflow-y-auto px-5 py-6"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } } }}
            >
              {[...links, { label: "Shop All", href: "/products" }].map((l) => (
                <motion.div key={l.href} variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}>
                  <Link href={l.href} onClick={onClose} className="block py-2.5 font-display text-2xl text-charcoal">
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="eyebrow mt-8 mb-2">
                Categories
              </motion.p>
              {categories.map((cat) => (
                <motion.div
                  key={cat._id}
                  variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                  className="border-b border-border/70"
                >
                  <div className="flex items-center justify-between">
                    <Link href={`/category/${cat.slug}`} onClick={onClose} className="flex-1 py-3 text-[15px] text-charcoal">
                      {cat.name}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <button
                        aria-label={`Show ${cat.name} subcategories`}
                        aria-expanded={expanded === cat._id}
                        onClick={() => setExpanded((e) => (e === cat._id ? null : cat._id))}
                        className="grid size-9 place-items-center"
                      >
                        <ChevronDown className={`size-4 transition ${expanded === cat._id ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence initial={false}>
                    {expanded === cat._id && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pb-2 pl-3"
                      >
                        {cat.children?.map((sub) => (
                          <li key={sub._id}>
                            <Link href={`/category/${sub.slug}`} onClick={onClose} className="block py-2 text-sm text-stone">
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.nav>

            <div className="grid grid-cols-3 gap-2 border-t border-border p-4 text-center text-xs">
              <Link href={customer ? "/account" : "/login"} onClick={onClose} className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-cream">
                <User className="size-5" /> {customer ? "Account" : "Sign in"}
              </Link>
              <Link href="/wishlist" onClick={onClose} className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-cream">
                <Heart className="size-5" /> Wishlist
              </Link>
              <Link href="/account/orders" onClick={onClose} className="flex flex-col items-center gap-1.5 rounded-xl py-2 hover:bg-cream">
                <Package className="size-5" /> Orders
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
