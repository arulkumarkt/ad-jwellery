"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LoaderCircle, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import type { SessionAdmin } from "@/types";
import { activeNavItem } from "./admin-nav";
import { capitalize } from "./status-badge";

export function AdminHeader({ admin, onOpenMenu }: { admin: SessionAdmin; onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const current = activeNavItem(pathname);
  const initials = admin.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/admin/auth/logout", { method: "POST", body: {} });
    } catch {
      /* cookie is cleared server-side either way */
    }
    toast.success("Signed out");
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-ivory/80 backdrop-blur-xl print:hidden">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          className="grid size-10 place-items-center rounded-xl border border-border bg-white text-charcoal lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.26em] text-gold-600">
            {current?.label ?? "Admin"}
          </p>
          <p className="hidden truncate text-sm text-stone sm:block">{current?.description ?? "Swarnika atelier"}</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="hidden h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-xs font-medium text-charcoal transition hover:border-gold-300 hover:text-gold-700 sm:inline-flex"
        >
          <ExternalLink className="size-3.5" />
          View store
        </Link>
        <div className="flex items-center gap-3 rounded-full border border-border bg-white py-1 pl-1 pr-1 sm:pr-2">
          <span className="grid size-8 place-items-center rounded-full bg-gold-gradient text-xs font-semibold text-charcoal">
            {initials || "A"}
          </span>
          <span className="hidden flex-col leading-tight md:flex">
            <span className="max-w-36 truncate text-xs font-semibold text-charcoal">{admin.name}</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-stone">{capitalize(admin.role)}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="grid size-8 place-items-center rounded-full text-stone transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            aria-label="Sign out"
            title="Sign out"
          >
            {loggingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
