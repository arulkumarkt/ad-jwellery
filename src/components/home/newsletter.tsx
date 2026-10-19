"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion";
import { api, errorMessage } from "@/lib/fetcher";

export function Newsletter({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setState("loading");
    try {
      await api("/api/newsletter", { method: "POST", body: { email, source: "homepage" } });
      setState("done");
    } catch (err) {
      toast.error(errorMessage(err));
      setState("idle");
    }
  };

  return (
    <section className="container-lux py-16 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-gold-gradient px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_35%)]" />
        <div className="relative mx-auto max-w-xl">
          <p className="eyebrow !text-charcoal/70">{eyebrow}</p>
          <h2 className="mt-3 text-4xl text-charcoal sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 text-sm text-charcoal/75 sm:text-base">{subtitle}</p>}
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.p
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-6 py-3 text-sm text-ivory"
              >
                <Check className="size-4 text-gold-300" /> You&apos;re on the list. Welcome to the circle!
              </motion.p>
            ) : (
              <motion.form key="form" exit={{ opacity: 0 }} onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-12 flex-1 rounded-full border border-charcoal/10 bg-ivory/90 px-5 text-sm text-charcoal outline-none placeholder:text-stone focus:ring-4 focus:ring-ivory/60"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-charcoal px-7 text-sm font-medium text-ivory transition hover:bg-ink disabled:opacity-70"
                >
                  {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <>Subscribe <ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}
