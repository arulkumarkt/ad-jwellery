"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, LoaderCircle, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { SiteSettingsDTO } from "@/types";
import { adminInput, adminTextarea, notifyError, num } from "./admin-utils";
import { CharCount, FormSection, ToggleRow } from "./form-bits";
import { SingleImageField } from "./image-uploader";
import { PageHeader } from "./page-header";

type ShippingForm = Omit<SiteSettingsDTO["shipping"], "freeShippingThreshold" | "flatRate" | "codFee"> & {
  freeShippingThreshold: string;
  flatRate: string;
  codFee: string;
};
type Form = Omit<SiteSettingsDTO, "shipping"> & { shipping: ShippingForm };

function toForm(s: SiteSettingsDTO): Form {
  return {
    ...s,
    announcements: [...s.announcements],
    shipping: {
      ...s.shipping,
      freeShippingThreshold: String(s.shipping.freeShippingThreshold),
      flatRate: String(s.shipping.flatRate),
      codFee: String(s.shipping.codFee),
    },
  };
}

const NAV = [
  { id: "store", label: "Store" },
  { id: "announcements", label: "Announcements" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social" },
  { id: "shipping", label: "Shipping" },
  { id: "policies", label: "Policies" },
  { id: "seo", label: "SEO" },
];

export function SettingsForm({ settings, canEdit }: { settings: SiteSettingsDTO; canEdit: boolean }) {
  const router = useRouter();
  const [initial, setInitial] = useState(() => toForm(settings));
  const [f, setF] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(f) !== JSON.stringify(initial), [f, initial]);

  function group<G extends "contact" | "social" | "shipping" | "policies" | "seo">(g: G, patch: Partial<Form[G]>) {
    setF((prev) => ({ ...prev, [g]: { ...prev[g], ...patch } }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const body = {
      ...f,
      announcements: f.announcements.map((a) => a.trim()).filter(Boolean),
      shipping: {
        ...f.shipping,
        freeShippingThreshold: num(f.shipping.freeShippingThreshold),
        flatRate: num(f.shipping.flatRate),
        codFee: num(f.shipping.codFee),
      },
    };
    try {
      const saved = await api<SiteSettingsDTO>("/api/settings", { method: "PUT", body });
      const next = toForm(saved);
      setInitial(next);
      setF(next);
      toast.success("Settings saved", { description: "Storefront updated." });
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't save settings"));
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k] || undefined;
  const disabled = !canEdit;

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        eyebrow="Storefront"
        title="Settings"
        description="Store identity, contact details, shipping rules, policies and default SEO."
      />
      {!canEdit && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-4 py-3 text-sm text-gold-800">
          <Lock className="size-4 shrink-0" />
          Only the store owner can change settings. You can view them below.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="sticky top-28 space-y-1 text-sm">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="block rounded-lg px-3 py-2 text-stone transition hover:bg-white hover:text-charcoal">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-6">
          <FormSection id="store" title="Store identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Store name" htmlFor="s-name" error={err("storeName")} required>
                <input id="s-name" className={adminInput} value={f.storeName} onChange={(e) => setF({ ...f, storeName: e.target.value })} />
              </FormField>
              <FormField label="Logo text" htmlFor="s-logo" error={err("logoText")} hint="Wordmark shown in the header">
                <input id="s-logo" className={cn(adminInput, "tracking-[0.2em]")} value={f.logoText} onChange={(e) => setF({ ...f, logoText: e.target.value })} />
              </FormField>
              <FormField label="Tagline" htmlFor="s-tag" error={err("tagline")} className="sm:col-span-2">
                <input id="s-tag" className={adminInput} value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            id="announcements"
            title="Announcement bar"
            description="Rotating messages at the very top of the store (max 6)."
            actions={
              <button
                type="button"
                onClick={() => setF({ ...f, announcements: [...f.announcements, ""] })}
                disabled={f.announcements.length >= 6}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-xs font-medium hover:border-gold-300 disabled:opacity-40"
              >
                <Plus className="size-3.5" /> Add
              </button>
            }
          >
            {f.announcements.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone">No announcements.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {f.announcements.map((a, i) => (
                    <motion.li
                      key={i}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="w-5 text-center text-xs tabular-nums text-stone">{i + 1}</span>
                      <div className="relative flex-1">
                        <input
                          className={cn(adminInput, "pr-14")}
                          value={a}
                          maxLength={140}
                          aria-invalid={!!err(`announcements.${i}`)}
                          onChange={(e) =>
                            setF({ ...f, announcements: f.announcements.map((x, k) => (k === i ? e.target.value : x)) })
                          }
                          placeholder="Free shipping on orders above ₹999"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">
                          <CharCount value={a} max={140} />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (i === 0) return;
                          const next = [...f.announcements];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          setF({ ...f, announcements: next });
                        }}
                        disabled={i === 0}
                        className="grid size-8 place-items-center rounded-full text-stone hover:bg-muted disabled:opacity-25"
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (i === f.announcements.length - 1) return;
                          const next = [...f.announcements];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          setF({ ...f, announcements: next });
                        }}
                        disabled={i === f.announcements.length - 1}
                        className="grid size-8 place-items-center rounded-full text-stone hover:bg-muted disabled:opacity-25"
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setF({ ...f, announcements: f.announcements.filter((_, k) => k !== i) })}
                        className="grid size-8 place-items-center rounded-full text-stone hover:bg-rose-50 hover:text-rose-700"
                        aria-label="Remove announcement"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </FormSection>

          <FormSection id="contact" title="Contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email" htmlFor="c-email" error={err("contact.email")}>
                <input id="c-email" type="email" className={adminInput} value={f.contact.email} onChange={(e) => group("contact", { email: e.target.value })} />
              </FormField>
              <FormField label="Phone" htmlFor="c-phone" error={err("contact.phone")}>
                <input id="c-phone" className={adminInput} value={f.contact.phone} onChange={(e) => group("contact", { phone: e.target.value })} />
              </FormField>
              <FormField label="WhatsApp" htmlFor="c-wa" error={err("contact.whatsapp")} hint="With country code, e.g. 919876543210">
                <input id="c-wa" className={adminInput} value={f.contact.whatsapp} onChange={(e) => group("contact", { whatsapp: e.target.value })} />
              </FormField>
              <FormField label="Hours" htmlFor="c-hours" error={err("contact.hours")}>
                <input id="c-hours" className={adminInput} value={f.contact.hours} onChange={(e) => group("contact", { hours: e.target.value })} placeholder="Mon–Sat, 10am – 7pm" />
              </FormField>
              <FormField label="Address" htmlFor="c-addr" error={err("contact.address")} className="sm:col-span-2">
                <textarea id="c-addr" className={cn(adminTextarea, "min-h-20")} value={f.contact.address} onChange={(e) => group("contact", { address: e.target.value })} />
              </FormField>
            </div>
          </FormSection>

          <FormSection id="social" title="Social profiles">
            <div className="grid gap-4 sm:grid-cols-2">
              {(["instagram", "facebook", "youtube", "pinterest"] as const).map((k) => (
                <FormField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} htmlFor={`so-${k}`} error={err(`social.${k}`)}>
                  <input
                    id={`so-${k}`}
                    className={adminInput}
                    value={f.social[k]}
                    onChange={(e) => group("social", { [k]: e.target.value })}
                    placeholder={`https://${k}.com/swarnika`}
                  />
                </FormField>
              ))}
            </div>
          </FormSection>

          <FormSection id="shipping" title="Shipping & payments">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Free shipping above (₹)" htmlFor="sh-free" error={err("shipping.freeShippingThreshold")} hint="0 = always free">
                <input id="sh-free" type="number" min={0} className={cn(adminInput, "tabular-nums")} value={f.shipping.freeShippingThreshold} onChange={(e) => group("shipping", { freeShippingThreshold: e.target.value })} />
              </FormField>
              <FormField label="Flat shipping rate (₹)" htmlFor="sh-flat" error={err("shipping.flatRate")}>
                <input id="sh-flat" type="number" min={0} className={cn(adminInput, "tabular-nums")} value={f.shipping.flatRate} onChange={(e) => group("shipping", { flatRate: e.target.value })} />
              </FormField>
              <FormField label="Estimated delivery" htmlFor="sh-eta" error={err("shipping.estimatedDelivery")}>
                <input id="sh-eta" className={adminInput} value={f.shipping.estimatedDelivery} onChange={(e) => group("shipping", { estimatedDelivery: e.target.value })} placeholder="3–7 business days" />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-2">
                <ToggleRow
                  label="Cash on delivery"
                  description="Allow customers to pay when the order arrives"
                  checked={f.shipping.codEnabled}
                  onChange={(v) => group("shipping", { codEnabled: v })}
                  disabled={disabled}
                />
              </div>
              <FormField label="COD fee (₹)" htmlFor="sh-cod" error={err("shipping.codFee")}>
                <input
                  id="sh-cod"
                  type="number"
                  min={0}
                  className={cn(adminInput, "tabular-nums")}
                  value={f.shipping.codFee}
                  disabled={disabled || !f.shipping.codEnabled}
                  onChange={(e) => group("shipping", { codFee: e.target.value })}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection id="policies" title="Policies" description="Plain text; line breaks are preserved on the storefront.">
            <div className="grid gap-4">
              {(
                [
                  ["shipping", "Shipping policy"],
                  ["returns", "Returns & exchanges"],
                  ["care", "Jewellery care"],
                ] as const
              ).map(([k, label]) => (
                <FormField key={k} label={label} htmlFor={`p-${k}`} error={err(`policies.${k}`)}>
                  <textarea id={`p-${k}`} className={cn(adminTextarea, "min-h-32")} value={f.policies[k]} maxLength={4000} onChange={(e) => group("policies", { [k]: e.target.value })} />
                </FormField>
              ))}
            </div>
          </FormSection>

          <FormSection id="seo" title="Default SEO" description="Used when a page doesn't define its own title or description.">
            <div className="grid gap-4">
              <FormField label="Default title" htmlFor="seo-t" error={err("seo.defaultTitle")}>
                <div className="relative">
                  <input id="seo-t" className={cn(adminInput, "pr-16")} value={f.seo.defaultTitle} onChange={(e) => group("seo", { defaultTitle: e.target.value })} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]">
                    <CharCount value={f.seo.defaultTitle} max={70} />
                  </span>
                </div>
              </FormField>
              <FormField label="Default description" htmlFor="seo-d" error={err("seo.defaultDescription")}>
                <div className="relative">
                  <textarea id="seo-d" className={cn(adminTextarea, "min-h-20 pb-6")} value={f.seo.defaultDescription} onChange={(e) => group("seo", { defaultDescription: e.target.value })} />
                  <span className="absolute bottom-2 right-3 text-[11px]">
                    <CharCount value={f.seo.defaultDescription} max={170} />
                  </span>
                </div>
              </FormField>
              <FormField label="Default share image" error={err("seo.ogImage")} hint="1200×630 recommended">
                <div className="max-w-sm">
                  {disabled ? (
                    <p className="text-sm text-stone">{f.seo.ogImage || "Not set"}</p>
                  ) : (
                    <SingleImageField value={f.seo.ogImage} onChange={(v) => group("seo", { ogImage: v })} aspect="aspect-[1200/630]" />
                  )}
                </div>
              </FormField>
            </div>
          </FormSection>
        </fieldset>
      </div>

      {canEdit && (
        <div className="sticky bottom-4 z-30 mt-6 rounded-2xl border border-border bg-white/90 shadow-lift backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="flex items-center gap-2 text-xs text-stone">
              <span className={cn("size-2 rounded-full", dirty ? "bg-amber-500" : "bg-emerald-500")} />
              {dirty ? "Unsaved changes" : "All changes saved"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setF(initial)}
                disabled={!dirty || saving}
                className="inline-flex h-10 items-center rounded-full border border-border bg-white px-5 text-sm font-medium transition hover:bg-muted disabled:opacity-40"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={saving || !dirty}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-charcoal px-6 text-sm font-medium text-ivory shadow-soft transition hover:bg-gold-700 disabled:opacity-50"
              >
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                Save settings
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
