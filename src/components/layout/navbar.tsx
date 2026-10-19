"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/common/logo";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types";
import { MegaMenu } from "./mega-menu";
import { MobileNav } from "./mobile-nav";
import { primaryLinks } from "./nav-data";

function CountBubble({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-semibold leading-[18px] text-white ring-2 ring-ivory"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const iconBtn =
  "relative grid size-10 place-items-center rounded-full text-charcoal transition hover:bg-charcoal/5 hover:text-gold-700";

export function Navbar({ categories, logoText }: { categories: CategoryDTO[]; logoText: string }) {
  const pathname = usePathname();
  const { cartCount, wishlistIds, openCart, openSearch, customer } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const links = primaryLinks(categories);

  // Compact + glass after scrolling; hide on fast downward scroll, reveal on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 320 && y > prev + 4 && !megaOpen);
    if (y < prev - 4) setHidden(false);
  });

  // Close menus when the route changes (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <>
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled ? "bg-ivory/80 shadow-[0_1px_0_var(--border)] backdrop-blur-xl" : "bg-ivory",
        )}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div
          className={cn(
            "container-lux grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-500",
            scrolled ? "h-16" : "h-[4.5rem] lg:h-20",
          )}
        >
          {/* Left: menu (mobile) / links (desktop) */}
          <div className="flex items-center gap-1">
            <button className={cn(iconBtn, "lg:hidden")} aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </button>
            <button className={cn(iconBtn, "lg:hidden")} aria-label="Search" onClick={openSearch}>
              <Search className="size-5" />
            </button>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              <button
                onMouseEnter={() => setMegaOpen(true)}
                onClick={() => setMegaOpen((o) => !o)}
                aria-expanded={megaOpen}
                className="group relative flex items-center gap-1 px-3 py-2 text-[13px] font-medium uppercase tracking-[0.14em] text-charcoal"
              >
                Shop
                <ChevronDown className={cn("size-3.5 transition", megaOpen && "rotate-180")} />
                <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-500 transition-transform duration-300 group-hover:scale-x-100" />
              </button>
              {links.map((l) => {
                const active = pathname === l.href.split("?")[0] && !l.href.includes("?");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onMouseEnter={() => setMegaOpen(false)}
                    className="group relative px-3 py-2 text-[13px] font-medium uppercase tracking-[0.14em] text-charcoal"
                  >
                    {l.label}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-gold-500 transition-transform duration-300 group-hover:scale-x-100",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          <Logo text={logoText} />

          {/* Right: actions */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              onClick={openSearch}
              className="hidden h-10 items-center gap-2 rounded-full border border-border bg-card/60 pl-3 pr-2 text-xs text-stone transition hover:border-gold-300 hover:text-charcoal lg:flex"
            >
              <Search className="size-4" />
              <span className="w-28 text-left">Search jewellery</span>
              <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
            </button>
            <Link href={customer ? "/account" : "/login"} className={cn(iconBtn, "hidden sm:grid")} aria-label={customer ? "My account" : "Sign in"}>
              <User className="size-5" />
            </Link>
            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label="Wishlist">
              <Heart className="size-5" />
              <CountBubble count={wishlistIds.size} />
            </Link>
            <button className={iconBtn} aria-label={`Bag, ${cartCount} items`} onClick={openCart}>
              <ShoppingBag className="size-5" />
              <CountBubble count={cartCount} />
            </button>
          </div>
        </div>

        <AnimatePresence>{megaOpen && <MegaMenu categories={categories} onNavigate={() => setMegaOpen(false)} />}</AnimatePresence>
      </motion.header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} links={links} logoText={logoText} />
    </>
  );
}
