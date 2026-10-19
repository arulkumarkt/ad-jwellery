"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { EASE } from "@/components/motion";
import { FormField } from "@/components/common/form-field";
import { api, ApiClientError } from "@/lib/fetcher";
import type { SessionAdmin } from "@/types";
import { cn } from "@/lib/utils";

const HERO =
  "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1400&q=80&auto=format&fit=crop";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setLoading(true);
    try {
      const admin = await api<SessionAdmin>("/api/admin/auth/login", { method: "POST", body: { email, password } });
      toast.success(`Welcome back, ${admin.name.split(" ")[0]}`);
      router.replace(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrors(err.fields ?? {});
        setFormError(err.message);
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
      setLoading(false);
    }
  }

  const field =
    "h-12 w-full rounded-xl border border-input bg-white pl-11 pr-4 text-sm text-charcoal outline-none transition placeholder:text-stone/60 focus:border-gold-400 focus:ring-4 focus:ring-gold-100 aria-invalid:border-destructive";

  return (
    <div className="grid min-h-dvh bg-ivory lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-charcoal lg:block">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO} alt="" className="size-full object-cover opacity-60" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/90 via-charcoal/40 to-gold-700/40" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gold-gradient font-display text-2xl font-semibold text-charcoal">
              S
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl font-semibold tracking-[0.3em] text-ivory">SWARNIKA</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.45em] text-gold-300">Atelier admin</span>
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            className="max-w-md"
          >
            <p className="eyebrow !text-gold-300">Behind the jewel box</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-ivory xl:text-6xl">
              Curate every piece with <span className="text-gold-gradient italic">intention.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-ivory/70">
              Manage your collections, orders and storefront from one quietly powerful workspace.
            </p>
          </motion.div>
          <p className="text-xs text-ivory/40">© {new Date().getFullYear()} Swarnika Covering Jewellery</p>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-gold-100/50 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <span className="font-display text-2xl font-semibold tracking-[0.3em] text-charcoal">SWARNIKA</span>
          </div>
          <p className="eyebrow">Admin console</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Welcome back</h2>
          <p className="mt-2 text-sm text-stone">Sign in with your staff credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            {formError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                role="alert"
              >
                {formError}
              </motion.p>
            )}
            <FormField label="Email" htmlFor="admin-email" error={errors.email}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  placeholder="you@swarnika.in"
                  className={field}
                  required
                  autoFocus
                />
              </div>
            </FormField>
            <FormField label="Password" htmlFor="admin-password" error={errors.password}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone" />
                <input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  placeholder="••••••••"
                  className={cn(field, "pr-11")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-stone hover:bg-muted"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-charcoal text-sm font-medium text-ivory shadow-soft transition hover:bg-gold-700 disabled:opacity-50"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />}
            </button>
          </form>
          <p className="mt-8 flex items-center gap-2 text-xs text-stone">
            <ShieldCheck className="size-4 text-gold-600" />
            Protected area. All actions are logged.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
