"use client";

import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** White card section used to group form fields. */
export function FormSection({
  title,
  description,
  children,
  className,
  actions,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-28 rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-charcoal sm:text-2xl">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-stone">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Gold-accented switch. */
export function GoldSwitch(props: React.ComponentProps<typeof Switch>) {
  return <Switch {...props} className={cn("data-checked:bg-gold-500", props.className)} />;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/70 bg-ivory/50 px-4 py-3 transition hover:border-gold-200">
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        {description && <span className="block text-xs text-stone">{description}</span>}
      </span>
      <GoldSwitch checked={checked} onCheckedChange={(v) => onChange(v)} disabled={disabled} />
    </label>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span className={cn("tabular-nums", n > max ? "text-destructive" : n > max * 0.9 ? "text-amber-700" : "text-stone/70")}>
      {n}/{max}
    </span>
  );
}
