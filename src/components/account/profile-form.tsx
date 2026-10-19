"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, inputClass } from "@/components/common/form-field";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api, errorMessage } from "@/lib/fetcher";
import { profileSchema } from "@/lib/validators";
import type { CustomerDTO } from "@/types";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "./form-utils";

export function ProfileForm({ profile }: { profile: CustomerDTO }) {
  const router = useRouter();
  const { customer, setCustomer } = useStore();
  const initial = { name: profile.name, phone: profile.phone ?? "", marketingOptIn: profile.marketingOptIn };
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const dirty = values.name !== saved.name || values.phone !== saved.phone || values.marketingOptIn !== saved.marketingOptIn;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const updated = await api<CustomerDTO>("/api/account/profile", { method: "PUT", body: parsed.data });
      const next = { name: updated.name, phone: updated.phone ?? "", marketingOptIn: updated.marketingOptIn };
      setValues(next);
      setSaved(next);
      if (customer) setCustomer({ ...customer, name: updated.name });
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      setErrors(serverFieldErrors(err));
      toast.error(errorMessage(err, "Could not update your profile"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="pf-name" error={errors.name} required>
          <input
            id="pf-name"
            autoComplete="name"
            className={inputClass}
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            aria-invalid={!!errors.name}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="pf-phone" error={errors.phone}>
          <input
            id="pf-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            className={inputClass}
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            aria-invalid={!!errors.phone}
          />
        </FormField>
      </div>
      <FormField label="Email" htmlFor="pf-email" hint="Contact us to change the email linked to your account.">
        <input id="pf-email" className={inputClass} value={profile.email} disabled readOnly />
      </FormField>
      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-ivory/60 p-4">
        <span>
          <span className="block text-sm font-medium text-charcoal">New arrivals & private offers</span>
          <span className="mt-0.5 block text-xs text-stone">An occasional email when a new collection drops. No spam, ever.</span>
        </span>
        <Switch checked={values.marketingOptIn} onCheckedChange={(v) => setValues({ ...values, marketingOptIn: v })} className="mt-1" />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="xl" disabled={loading || !dirty}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {loading ? "Saving…" : "Save changes"}
        </Button>
        {dirty && !loading && (
          <button type="button" onClick={() => { setValues(saved); setErrors({}); }} className="text-sm text-stone underline-offset-4 hover:text-charcoal hover:underline">
            Discard
          </button>
        )}
      </div>
    </form>
  );
}
