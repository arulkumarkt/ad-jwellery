"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, LayoutGrid, MapPin, Package, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account", label: "Overview", icon: LayoutGrid },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/account" ? pathname === "/account" : pathname.startsWith(href);
}

/** Sidebar on desktop, horizontally scrollable pill tabs on mobile. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile pills */}
      <nav aria-label="Account" className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:hidden">
        <ul className="flex w-max gap-2 pb-1">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
                    active ? "border-charcoal text-ivory" : "border-border bg-card text-charcoal hover:border-gold-300",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="account-nav-pill"
                      className="absolute inset-0 rounded-full bg-charcoal"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <item.icon className="relative size-4" strokeWidth={1.6} />
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop sidebar */}
      <nav aria-label="Account" className="hidden lg:block">
        <ul className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-3 shadow-soft">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-12 items-center gap-3 rounded-2xl px-4 text-sm transition-colors",
                    active ? "text-charcoal" : "text-stone hover:text-charcoal",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="account-nav-active"
                      className="absolute inset-0 rounded-2xl bg-gold-50 ring-1 ring-gold-200"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="account-nav-bar"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gold-gradient"
                    />
                  )}
                  <item.icon className={cn("relative size-[18px]", active ? "text-gold-600" : "text-stone/80 group-hover:text-gold-600")} strokeWidth={1.6} />
                  <span className="relative font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-border px-4 pt-4 pb-2">
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </>
  );
}
