"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, CircleSlash, ClipboardCheck, Clock, Home, PackageOpen, RotateCcw, Truck, type LucideIcon } from "lucide-react";
import { EASE } from "@/components/motion";
import { cn, formatDate } from "@/lib/utils";
import type { OrderDTO, OrderStatus } from "@/types";

const STEPS: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
  { status: "pending", label: "Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: ClipboardCheck },
  { status: "processing", label: "Processing", icon: PackageOpen },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Home },
];

/** Animated progress stepper for an order's fulfilment status. */
export function OrderTracker({ order }: { order: Pick<OrderDTO, "status" | "statusHistory" | "trackingNumber"> }) {
  const reduce = useReducedMotion();
  const { status, statusHistory } = order;

  if (status === "cancelled" || status === "returned") {
    const entry = [...statusHistory].reverse().find((h) => h.status === status);
    const Icon = status === "cancelled" ? CircleSlash : RotateCcw;
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={cn(
          "flex items-start gap-4 rounded-2xl p-5",
          status === "cancelled" ? "bg-destructive/5 ring-1 ring-destructive/15" : "bg-blush/60 ring-1 ring-blush",
        )}
      >
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-white text-ink")}>
          <Icon className="size-5" strokeWidth={1.6} />
        </span>
        <div>
          <p className="font-display text-2xl text-charcoal">{status === "cancelled" ? "Order cancelled" : "Order returned"}</p>
          <p className="mt-1 text-sm text-stone">
            {entry?.note || (status === "cancelled" ? "This order was cancelled." : "This order has been returned.")}
            {entry && <> · {formatDate(entry.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</>}
          </p>
          <p className="mt-2 text-xs text-stone">Any prepaid amount is refunded to the original payment method within 5–7 working days.</p>
        </div>
      </motion.div>
    );
  }

  const current = Math.max(0, STEPS.findIndex((s) => s.status === status));
  const reachedAt = (s: OrderStatus) => statusHistory.find((h) => h.status === s)?.at;
  const progress = current / (STEPS.length - 1);

  return (
    <div className="relative">
      {/* Vertical track (mobile) */}
      <div aria-hidden className="absolute bottom-5 left-[21px] top-5 w-0.5 rounded-full bg-sand sm:hidden">
        <motion.div
          className="absolute inset-0 origin-top rounded-full bg-gold-gradient"
          initial={reduce ? false : { scaleY: 0 }}
          animate={{ scaleY: progress }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
        />
      </div>
      {/* Horizontal track (sm+) */}
      <div aria-hidden className="absolute left-[10%] right-[10%] top-[21px] hidden h-0.5 rounded-full bg-sand sm:block">
        <motion.div
          className="absolute inset-0 origin-left rounded-full bg-gold-gradient"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
        />
      </div>
      <ol className="relative flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-0">
        {STEPS.map((step, i) => {
          const done = i < current || (i === current && status === "delivered");
          const active = i === current && status !== "delivered";
          const at = reachedAt(step.status);
          return (
            <motion.li
              key={step.status}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.15 + i * 0.12 }}
              className="flex items-center gap-4 sm:w-1/5 sm:flex-col sm:gap-3 sm:text-center"
            >
              <span
                className={cn(
                  "relative grid size-11 shrink-0 place-items-center rounded-full border-2 bg-card transition-colors",
                  done && "border-transparent bg-gold-gradient text-charcoal",
                  active && "border-gold-400 text-gold-700",
                  !done && !active && "border-sand text-stone/60",
                )}
              >
                {active && !reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-gold-300"
                    animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                {done ? <Check className="size-5" strokeWidth={2} /> : <step.icon className="size-[18px]" strokeWidth={1.6} />}
              </span>
              <div>
                <p className={cn("text-sm font-medium", done || active ? "text-charcoal" : "text-stone/70")}>{step.label}</p>
                <p className="text-[11px] text-stone">{at ? formatDate(at, { day: "numeric", month: "short" }) : active ? "In progress" : " "}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
