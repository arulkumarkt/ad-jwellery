"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Tag, X } from "lucide-react";
import { inputClass } from "@/components/common/form-field";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CouponInput() {
  const { cart, applyCoupon } = useStore();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const applied = cart?.couponCode ?? null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 2) return;
    setPending(true);
    if (await applyCoupon(c)) setCode("");
    setPending(false);
  }

  async function remove() {
    setPending(true);
    await applyCoupon(null);
    setPending(false);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {applied ? (
        <motion.div
          key="applied"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border border-dashed px-4 py-3",
            cart?.couponError ? "border-destructive/40 bg-destructive/5" : "border-gold-300 bg-gold-50/60",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Tag className={cn("size-4 shrink-0", cart?.couponError ? "text-destructive" : "text-gold-600")} />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wider text-charcoal">{applied}</p>
              <p className={cn("truncate text-xs", cart?.couponError ? "text-destructive" : "text-stone")}>
                {cart?.couponError || cart?.couponDescription || "Coupon applied"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Remove coupon"
            className="grid size-9 place-items-center rounded-full text-stone transition hover:bg-white hover:text-charcoal"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          </button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex gap-2">
          <label htmlFor="coupon" className="sr-only">
            Coupon code
          </label>
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gold-500" />
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              autoComplete="off"
              maxLength={32}
              className={cn(inputClass, "pl-10 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal")}
            />
          </div>
          <Button type="submit" variant="outline" size="xl" disabled={pending || code.trim().length < 2} className="px-5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
