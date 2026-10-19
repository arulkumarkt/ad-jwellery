"use client";

import { Briefcase, Home, Loader2, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AddressDTO } from "@/types";

function LabelIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  const Icon = l === "home" ? Home : l === "work" ? Briefcase : MapPin;
  return <Icon className="size-3.5" strokeWidth={1.8} />;
}

/** Address book entry with edit / delete / set-default actions. */
export function AddressCard({
  address,
  onEdit,
  onDelete,
  onMakeDefault,
  busy,
}: {
  address: AddressDTO;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
  busy?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-3xl border bg-card p-5 shadow-soft transition sm:p-6",
        address.isDefault ? "border-gold-300 ring-1 ring-gold-200" : "border-border hover:border-gold-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
          <LabelIcon label={address.label || "Other"} />
          {address.label || "Address"}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700">
            <Star className="size-3.5 fill-gold-400 text-gold-400" /> Default
          </span>
        )}
      </div>
      <address className="mt-4 flex-1 text-sm not-italic leading-relaxed text-stone">
        <span className="block text-base font-medium text-charcoal">{address.fullName}</span>
        {address.line1}
        {address.line2 && <>, {address.line2}</>}
        {address.landmark && <span className="block">Near {address.landmark}</span>}
        <span className="block">
          {address.city}, {address.state} – {address.pincode}
        </span>
        <span className="mt-2 block text-charcoal">+91 {address.phone.replace(/^\+91/, "")}</span>
      </address>
      <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-border pt-4">
        <button type="button" onClick={onEdit} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-charcoal transition hover:bg-gold-50 hover:text-gold-700">
          <Pencil className="size-3.5" /> Edit
        </button>
        <button type="button" onClick={onDelete} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-stone transition hover:bg-destructive/5 hover:text-destructive">
          <Trash2 className="size-3.5" /> Remove
        </button>
        {!address.isDefault && (
          <button
            type="button"
            onClick={onMakeDefault}
            disabled={busy}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-gold-700 transition hover:bg-gold-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Star className="size-3.5" />} Set as default
          </button>
        )}
      </div>
    </article>
  );
}
