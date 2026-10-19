"use client";

import { ChevronDown } from "lucide-react";
import { FormField, inputClass } from "@/components/common/form-field";
import { INDIAN_STATES } from "@/components/checkout/indian-states";
import { cn } from "@/lib/utils";

export interface AddressValues {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const EMPTY_ADDRESS: AddressValues = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

/** Controlled Indian shipping-address inputs shared by the address book and checkout. */
export function AddressFields({
  values,
  onChange,
  errors,
  idPrefix = "addr",
}: {
  values: AddressValues;
  onChange: (patch: Partial<AddressValues>) => void;
  errors: Partial<Record<keyof AddressValues, string>>;
  idPrefix?: string;
}) {
  const id = (k: keyof AddressValues) => `${idPrefix}-${k}`;
  const text = (k: keyof AddressValues) => ({
    id: id(k),
    name: k,
    value: values[k],
    onChange: (e: { target: { value: string } }) => onChange({ [k]: e.target.value }),
    "aria-invalid": !!errors[k],
    className: inputClass,
  });
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
      <FormField label="Full name" htmlFor={id("fullName")} error={errors.fullName} required>
        <input {...text("fullName")} autoComplete="shipping name" placeholder="Recipient's name" />
      </FormField>
      <FormField label="Mobile number" htmlFor={id("phone")} error={errors.phone} required>
        <input {...text("phone")} type="tel" inputMode="tel" autoComplete="shipping tel" placeholder="10-digit mobile" />
      </FormField>
      <FormField label="Flat, house no., building" htmlFor={id("line1")} error={errors.line1} required className="sm:col-span-2">
        <input {...text("line1")} autoComplete="shipping address-line1" placeholder="House / flat, street" />
      </FormField>
      <FormField label="Area, sector, village" htmlFor={id("line2")} error={errors.line2}>
        <input {...text("line2")} autoComplete="shipping address-line2" placeholder="Optional" />
      </FormField>
      <FormField label="Landmark" htmlFor={id("landmark")} error={errors.landmark}>
        <input {...text("landmark")} placeholder="Optional" />
      </FormField>
      <FormField label="PIN code" htmlFor={id("pincode")} error={errors.pincode} required>
        <input
          {...text("pincode")}
          onChange={(e) => onChange({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          inputMode="numeric"
          autoComplete="shipping postal-code"
          placeholder="6-digit PIN"
          maxLength={6}
        />
      </FormField>
      <FormField label="City / town" htmlFor={id("city")} error={errors.city} required>
        <input {...text("city")} autoComplete="shipping address-level2" placeholder="City" />
      </FormField>
      <FormField label="State" htmlFor={id("state")} error={errors.state} required>
        <div className="relative">
          <select
            {...text("state")}
            autoComplete="shipping address-level1"
            className={cn(inputClass, "appearance-none pr-10", !values.state && "text-stone/60")}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-stone" />
        </div>
      </FormField>
      <FormField label="Country" htmlFor={id("country")}>
        <input id={id("country")} value="India" readOnly disabled className={inputClass} />
      </FormField>
    </div>
  );
}

/** Picks the `shippingAddress.*` (or bare) keys out of a field-error map. */
export function addressErrors(errors: Record<string, string>, prefix = ""): Partial<Record<keyof AddressValues, string>> {
  const out: Partial<Record<keyof AddressValues, string>> = {};
  for (const k of Object.keys(EMPTY_ADDRESS) as (keyof AddressValues)[]) {
    const e = errors[prefix + k];
    if (e) out[k] = e;
  }
  return out;
}
