"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, inputClass } from "@/components/common/form-field";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/fetcher";
import { loginSchema } from "@/lib/validators";
import type { SessionCustomer } from "@/types";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "./form-utils";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next: string | null }) {
  const router = useRouter();
  const { setCustomer } = useStore();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof values, value: string) => {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    setFormError(null);
    if (submitted) {
      const r = loginSchema.safeParse(nextValues);
      setErrors(r.success ? {} : zodFieldErrors(r.error));
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const session = await api<SessionCustomer>("/api/auth/login", { body: parsed.data });
      setCustomer(session);
      toast.success(`Welcome back, ${session.name.split(" ")[0]}`);
      router.replace(next || "/account");
      router.refresh();
    } catch (err) {
      setErrors(serverFieldErrors(err));
      setFormError(errorMessage(err, "Could not sign you in"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <AnimatePresence initial={false}>
        {formError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>
      <FormField label="Email" htmlFor="email" error={errors.email} required>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={!!errors.email}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password} required>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          aria-invalid={!!errors.password}
        />
      </FormField>
      <Button type="submit" variant="default" size="xl" disabled={loading} className="mt-2 w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? "Signing in…" : "Sign in"}
        {!loading && <ArrowRight className="size-4 transition group-hover/button:translate-x-0.5" />}
      </Button>
      <p className="text-center text-xs text-stone">
        Prefer not to sign in?{" "}
        <Link href="/checkout" className="font-medium text-gold-700 underline-offset-4 hover:underline">
          Checkout as guest
        </Link>
      </p>
    </form>
  );
}
