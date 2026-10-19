"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Landmark, ShieldCheck, Smartphone } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export function PaymentOptions({
  value,
  onChange,
  onlineEnabled,
  codEnabled,
  codFee,
}: {
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  onlineEnabled: boolean;
  codEnabled: boolean;
  codFee: number;
}) {
  const options: {
    id: PaymentMethod;
    title: string;
    description: string;
    disabled: boolean;
    note?: string;
    icon: ReactNode;
  }[] = [
    {
      id: "razorpay",
      title: "Pay online",
      description: "UPI, cards, net banking & wallets via Razorpay",
      disabled: !onlineEnabled,
      note: onlineEnabled ? "Recommended · faster dispatch" : "Online payment coming soon",
      icon: (
        <span className="flex -space-x-1.5">
          <Smartphone className="size-5" strokeWidth={1.6} />
          <CreditCard className="size-5" strokeWidth={1.6} />
          <Landmark className="size-5" strokeWidth={1.6} />
        </span>
      ),
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      description: "Pay in cash or UPI when your order arrives",
      disabled: !codEnabled,
      note: !codEnabled ? "Currently unavailable" : codFee > 0 ? `${formatPrice(codFee)} COD handling fee applies` : "No extra charges",
      icon: <Banknote className="size-5" strokeWidth={1.6} />,
    },
  ];

  return (
    <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
      {options.map((o) => {
        const selected = value === o.id && !o.disabled;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={o.disabled}
            disabled={o.disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left transition sm:p-5",
              selected ? "border-gold-400" : "border-border hover:border-gold-200",
              o.disabled && "cursor-not-allowed opacity-60 hover:border-border",
            )}
          >
            {selected && (
              <motion.span
                layoutId="payment-selected"
                className="absolute inset-0 rounded-2xl bg-gold-50/60 ring-2 ring-gold-300"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={cn(
                "relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition",
                selected ? "border-gold-500" : "border-input",
              )}
            >
              {selected && <motion.span layoutId="payment-dot" className="size-2.5 rounded-full bg-gold-500" />}
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="text-base font-medium text-charcoal">{o.title}</span>
                <span className={cn("text-gold-600", o.disabled && "text-stone")}>{o.icon}</span>
              </span>
              <span className="mt-0.5 block text-sm text-stone">{o.description}</span>
              {o.note && (
                <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium", o.disabled ? "bg-sand/60 text-ink" : "bg-cream text-gold-700")}>
                  {o.note}
                </span>
              )}
            </span>
          </button>
        );
      })}
      <p className="mt-1 flex items-center gap-2 text-xs text-stone">
        <ShieldCheck className="size-4 text-gold-600" /> Payments are encrypted and processed securely. We never store your card details.
      </p>
    </div>
  );
}
