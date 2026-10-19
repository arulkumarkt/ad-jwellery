"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/fetcher";
import { changePasswordSchema } from "@/lib/validators";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "./form-utils";
import { PasswordInput, PasswordStrength } from "./password-input";

type Values = { currentPassword: string; newPassword: string; confirm: string };
const EMPTY: Values = { currentPassword: "", newPassword: "", confirm: "" };

function validate(v: Values): FieldErrors {
  const r = changePasswordSchema.safeParse({ currentPassword: v.currentPassword, newPassword: v.newPassword });
  const errs = r.success ? {} : zodFieldErrors(r.error);
  if (v.confirm !== v.newPassword) errs.confirm = "Passwords do not match";
  return errs;
}

export function PasswordForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Values, v: string) => {
    const nv = { ...values, [k]: v };
    setValues(nv);
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
      await api("/api/account/password", {
        method: "PUT",
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      toast.success("Password updated", { description: "Other devices have been signed out." });
      setValues(EMPTY);
      setSubmitted(false);
    } catch (err) {
      setErrors(serverFieldErrors(err));
      toast.error(errorMessage(err, "Could not update password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-xl flex-col gap-5">
      <FormField label="Current password" htmlFor="pw-current" error={errors.currentPassword} required>
        <PasswordInput
          id="pw-current"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={(e) => set("currentPassword", e.target.value)}
          aria-invalid={!!errors.currentPassword}
        />
      </FormField>
      <FormField label="New password" htmlFor="pw-new" error={errors.newPassword} hint="8+ characters with a letter and a number" required>
        <PasswordInput
          id="pw-new"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(e) => set("newPassword", e.target.value)}
          aria-invalid={!!errors.newPassword}
        />
      </FormField>
      <PasswordStrength value={values.newPassword} />
      <FormField label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm} required>
        <PasswordInput
          id="pw-confirm"
          autoComplete="new-password"
          value={values.confirm}
          onChange={(e) => set("confirm", e.target.value)}
          aria-invalid={!!errors.confirm}
        />
      </FormField>
      <p className="rounded-2xl bg-gold-50/70 px-4 py-3 text-xs leading-relaxed text-ink ring-1 ring-gold-100">
        For your security, changing your password signs you out everywhere else — you&apos;ll stay signed in on this device.
      </p>
      <div>
        <Button type="submit" size="xl" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {loading ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
