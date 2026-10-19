"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, inputClass } from "@/components/common/form-field";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/fetcher";
import { registerSchema } from "@/lib/validators";
import type { SessionCustomer } from "@/types";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "./form-utils";
import { PasswordInput, PasswordStrength } from "./password-input";

type Values = { name: string; email: string; phone: string; password: string; confirm: string };

function validate(v: Values): FieldErrors {
  const r = registerSchema.safeParse({ name: v.name, email: v.email, phone: v.phone, password: v.password });
  const errs = r.success ? {} : zodFieldErrors(r.error);
  if (v.confirm !== v.password) errs.confirm = "Passwords do not match";
  return errs;
}

export function RegisterForm({ next }: { next: string | null }) {
  const router = useRouter();
  const { setCustomer } = useStore();
  const [values, setValues] = useState<Values>({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof Values, value: string) => {
    const nv = { ...values, [key]: value };
    setValues(nv);
    setFormError(null);
    if (submitted) setErrors(validate(nv));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const session = await api<SessionCustomer>("/api/auth/register", {
        body: { name: values.name, email: values.email, phone: values.phone, password: values.password },
      });
      setCustomer(session);
      toast.success(`Welcome to Swarnika, ${session.name.split(" ")[0]}`);
      router.replace(next || "/account");
      router.refresh();
    } catch (err) {
      setErrors(serverFieldErrors(err));
      setFormError(errorMessage(err, "Could not create your account"));
      setLoading(false);
    }
  }

  const field = (key: keyof Values) => ({
    id: key,
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    "aria-invalid": !!errors[key],
  });

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
      <FormField label="Full name" htmlFor="name" error={errors.name} required>
        <input {...field("name")} autoComplete="name" placeholder="Ananya Sharma" className={inputClass} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Email" htmlFor="email" error={errors.email} required>
          <input {...field("email")} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" className={inputClass} />
        </FormField>
        <FormField label="Mobile" htmlFor="phone" error={errors.phone} hint="Optional · for delivery updates">
          <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" className={inputClass} />
        </FormField>
      </div>
      <FormField label="Password" htmlFor="password" error={errors.password} required hint="8+ characters with a letter and a number">
        <PasswordInput {...field("password")} autoComplete="new-password" placeholder="Create a password" />
      </FormField>
      <PasswordStrength value={values.password} />
      <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm} required>
        <PasswordInput {...field("confirm")} autoComplete="new-password" placeholder="Repeat password" />
      </FormField>
      <Button type="submit" size="xl" disabled={loading} className="mt-2 w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? "Creating account…" : "Create account"}
        {!loading && <ArrowRight className="size-4" />}
      </Button>
      <p className="text-center text-[11px] leading-relaxed text-stone">
        By creating an account you agree to our terms of service and privacy policy.
      </p>
    </form>
  );
}
