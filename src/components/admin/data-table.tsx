"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  empty,
  className,
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty?: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode };
  className?: string;
  dense?: boolean;
}) {
  const router = useRouter();

  if (!rows.length) {
    const Icon = empty?.icon ?? Inbox;
    return (
      <div className={cn("rounded-2xl border border-dashed border-border bg-white/60 px-6 py-16 text-center", className)}>
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-gold-50 ring-1 ring-gold-200">
          <Icon className="size-6 text-gold-600" strokeWidth={1.5} />
        </div>
        <p className="font-display text-2xl text-charcoal">{empty?.title ?? "Nothing here yet"}</p>
        {empty?.description && <p className="mx-auto mt-1 max-w-sm text-sm text-stone">{empty.description}</p>}
        {empty?.action && <div className="mt-5 flex justify-center">{empty.action}</div>}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-white shadow-soft", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-ivory/70">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-stone first:pl-5 last:pr-5",
                    c.headerClassName,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const href = rowHref?.(row);
              return (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 14) * 0.03 }}
                  onClick={
                    href
                      ? (e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("a,button,input,select,label,[role=switch],[data-no-row-click]")) return;
                          if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
                          else router.push(href);
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-border/60 transition-colors last:border-0 hover:bg-gold-50/40",
                    href && "cursor-pointer",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-4 align-middle first:pl-5 last:pr-5", dense ? "py-2.5" : "py-3.5", c.className)}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
