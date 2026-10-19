"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField, inputClass } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api, errorMessage } from "@/lib/fetcher";
import { addressSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";
import type { AddressDTO } from "@/types";
import { AddressFields, EMPTY_ADDRESS, addressErrors, type AddressValues } from "./address-fields";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "./form-utils";

const LABELS = ["Home", "Work", "Other"];

/** Add / edit an address-book entry. */
export function AddressForm({
  address,
  onSaved,
  onCancel,
  defaultName = "",
}: {
  address?: AddressDTO | null;
  onSaved: (a: AddressDTO) => void;
  onCancel: () => void;
  defaultName?: string;
}) {
  const [values, setValues] = useState<AddressValues>(() =>
    address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          landmark: address.landmark,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: address.country || "India",
        }
      : { ...EMPTY_ADDRESS, fullName: defaultName },
  );
  const [label, setLabel] = useState(address?.label || "Home");
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const body = (v: AddressValues) => ({ ...v, label, isDefault });

  const patch = (p: Partial<AddressValues>) => {
    const nv = { ...values, ...p };
    setValues(nv);
    if (submitted) {
      const r = addressSchema.safeParse(body(nv));
      setErrors(r.success ? {} : zodFieldErrors(r.error));
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const parsed = addressSchema.safeParse(body(values));
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const saved = address
        ? await api<AddressDTO>(`/api/account/addresses/${address._id}`, { method: "PUT", body: parsed.data })
        : await api<AddressDTO>("/api/account/addresses", { method: "POST", body: parsed.data });
      toast.success(address ? "Address updated" : "Address saved");
      onSaved(saved);
    } catch (err) {
      setErrors(serverFieldErrors(err));
      toast.error(errorMessage(err, "Could not save the address"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormField label="Save as" error={errors.label}>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(l)}
              aria-pressed={label === l}
              className={cn(
                "h-10 rounded-full border px-5 text-sm transition",
                label === l ? "border-charcoal bg-charcoal text-ivory" : "border-border bg-card text-charcoal hover:border-gold-300",
              )}
            >
              {l}
            </button>
          ))}
          {!LABELS.includes(label) && (
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={cn(inputClass, "h-10 w-36")} maxLength={30} />
          )}
        </div>
      </FormField>
      <AddressFields values={values} onChange={patch} errors={addressErrors(errors)} idPrefix="book" />
      <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
        Make this my default address
      </label>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" size="xl" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" size="xl" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Saving…" : address ? "Update address" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
