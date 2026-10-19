"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isNavActive } from "./admin-nav";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-3 overflow-hidden" aria-label="Swarnika admin home">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-gradient font-display text-xl font-semibold text-charcoal shadow-soft">
        S
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-[0.24em] text-ivory">SWARNIKA</span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.4em] text-gold-300">Atelier admin</span>
        </span>
      )}
    </Link>
  );
}

function NavList({
  collapsed,
  onNavigate,
  layoutKey,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  layoutKey: string;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6 no-scrollbar" aria-label="Admin">
      {ADMIN_NAV.map((group) => (
        <div key={group.group}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-ivory/35">{group.group}</p>
          ) : (
            <div className="mx-auto mb-2 h-px w-6 bg-ivory/10" />
          )}
          <ul className="flex flex-col gap-1">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active ? "text-charcoal" : "text-ivory/65 hover:bg-white/5 hover:text-ivory",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`admin-nav-active-${layoutKey}`}
                        className="absolute inset-0 rounded-xl bg-gold-gradient shadow-[0_8px_24px_-12px_rgba(201,157,75,0.8)]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="relative size-[18px] shrink-0" strokeWidth={1.7} />
                    {!collapsed && <span className="relative truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 84 : 264 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="sticky top-0 hidden h-dvh shrink-0 flex-col bg-charcoal text-ivory lg:flex print:hidden"
      >
        <div className={cn("flex h-20 items-center border-b border-white/5 px-5", collapsed && "justify-center px-0")}>
          <Brand collapsed={collapsed} />
        </div>
        <NavList collapsed={collapsed} layoutKey="desktop" />
        <div className="border-t border-white/5 p-3">
          <Link
            href="/"
            target="_blank"
            className={cn(
              "mb-1 flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-ivory/55 transition hover:bg-white/5 hover:text-ivory",
              collapsed && "justify-center px-0",
            )}
            title="View store"
          >
            <ExternalLink className="size-4" />
            {!collapsed && "View storefront"}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-ivory/55 transition hover:bg-white/5 hover:text-ivory",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-charcoal text-ivory shadow-lift"
            >
              <div className="flex h-20 items-center justify-between border-b border-white/5 px-5">
                <Brand collapsed={false} />
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="grid size-9 place-items-center rounded-full text-ivory/70 transition hover:bg-white/10 hover:text-ivory"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NavList collapsed={false} onNavigate={onCloseMobile} layoutKey="mobile" />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
