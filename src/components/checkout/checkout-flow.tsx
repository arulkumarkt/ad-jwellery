"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2, Lock, Pencil, Plus, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AddressFields, EMPTY_ADDRESS, addressErrors, type AddressValues } from "@/components/account/address-fields";
import { serverFieldErrors, zodFieldErrors, type FieldErrors } from "@/components/account/form-utils";
import { EmptyState } from "@/components/common/empty-state";
import { FormField, inputClass } from "@/components/common/form-field";
import { Shimmer } from "@/components/common/skeletons";
import { EASE } from "@/components/motion";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiClientError, api, errorMessage } from "@/lib/fetcher";
import { cn, formatPrice } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators";
import type { AddressDTO, CartDTO, OrderDTO, PaymentMethod, SessionCustomer, SiteSettingsDTO } from "@/types";
import { CHECKOUT_STEPS, CheckoutSteps } from "./checkout-steps";
import { CheckoutItems, CheckoutSummary, CheckoutTotals } from "./checkout-summary";
import { CouponInput } from "./coupon-input";
import { PaymentOptions } from "./payment-options";
import { payWithRazorpay, type PaymentInit } from "./razorpay";

interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutFlowProps {
  customer: SessionCustomer | null;
  profile: Contact | null;
  addresses: AddressDTO[];
  settings: SiteSettingsDTO;
  paymentsEnabled: boolean;
}

const contactSchema = checkoutSchema.shape.contact;
const shippingSchema = checkoutSchema.shape.shippingAddress;

function toValues(a: AddressDTO): AddressValues {
  return {
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country || "India",
  };
}

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

export function CheckoutFlow({ customer, profile, addresses, settings, paymentsEnabled }: CheckoutFlowProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { cart, cartLoading, refreshCart } = useStore();

  const codEnabled = settings.shipping.codEnabled;
  const initialContact: Contact = profile ?? { name: customer?.name ?? "", email: customer?.email ?? "", phone: "" };
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const [contact, setContact] = useState<Contact>(initialContact);
  const [selectedAddress, setSelectedAddress] = useState<string>(defaultAddress?._id ?? "new");
  const [newAddress, setNewAddress] = useState<AddressValues>({
    ...EMPTY_ADDRESS,
    fullName: initialContact.name,
    phone: initialContact.phone,
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>(paymentsEnabled ? "razorpay" : "cod");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [step, setStep] = useState(() => (customer && contactSchema.safeParse(initialContact).success ? 1 : 0));
  const [direction, setDirection] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [quote, setQuote] = useState<{ method: PaymentMethod; source: CartDTO; cart: CartDTO } | null>(null);

  // Re-price the bag for the chosen payment method (COD may add a fee).
  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    const ctrl = new AbortController();
    api<CartDTO>(`/api/cart?payment=${method}`, { signal: ctrl.signal })
      .then((c) => setQuote({ method, source: cart, cart: c }))
      .catch(() => {
        // Fall back to the store's cart; the server recomputes the real total anyway.
        if (!ctrl.signal.aborted) setQuote({ method, source: cart, cart });
      });
    return () => ctrl.abort();
  }, [cart, method]);

  const fresh = quote?.method === method && quote.source === cart;
  const totals: CartDTO | null = fresh ? quote.cart : cart;
  const repricing = !!cart && !fresh;

  const shippingAddress: AddressValues = useMemo(() => {
    const saved = addresses.find((a) => a._id === selectedAddress);
    return saved ? toValues(saved) : newAddress;
  }, [addresses, selectedAddress, newAddress]);

  const unavailable = cart?.items.filter((i) => !i.available) ?? [];
  const methodAvailable = method === "cod" ? codEnabled : paymentsEnabled;

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function validateContact(): boolean {
    const r = contactSchema.safeParse(contact);
    if (r.success) {
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("contact."))));
      return true;
    }
    setErrors(zodFieldErrors(r.error, "contact."));
    return false;
  }

  function validateShipping(): boolean {
    const r = shippingSchema.safeParse(shippingAddress);
    if (r.success) {
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("shippingAddress."))));
      return true;
    }
    if (selectedAddress !== "new") {
      // A saved address that no longer validates: open it for editing.
      setNewAddress(shippingAddress);
      setSelectedAddress("new");
      toast.error("Please complete this address before continuing");
    }
    setErrors(zodFieldErrors(r.error, "shippingAddress."));
    return false;
  }

  function validateReview(): boolean {
    if (!cart || cart.items.length === 0) return false;
    if (unavailable.length) {
      toast.error("Some items are out of stock", { description: "Please update your bag to continue." });
      return false;
    }
    if (cart.couponError) {
      toast.error(cart.couponError, { description: "Remove the coupon to continue." });
      return false;
    }
    return true;
  }

  function advance() {
    if (step === 0 && validateContact()) go(1);
    else if (step === 1 && validateShipping()) go(2);
    else if (step === 2 && validateReview()) go(3);
    else if (step === 3) void placeOrder();
  }

  async function placeOrder() {
    if (placing) return;
    if (!validateContact()) return go(0);
    if (!validateShipping()) return go(1);
    if (!validateReview()) return go(2);
    if (!methodAvailable) {
      toast.error("Please choose an available payment method");
      return;
    }
    setPlacing(true);
    let result: { order: OrderDTO; payment: PaymentInit | null };
    try {
      result = await api<{ order: OrderDTO; payment: PaymentInit | null }>("/api/orders", {
        body: {
          contact,
          shippingAddress,
          saveAddress: !!customer && selectedAddress === "new" && saveAddress,
          paymentMethod: method,
          notes: notes.trim(),
        },
      });
    } catch (err) {
      setPlacing(false);
      const fields = serverFieldErrors(err);
      const status = err instanceof ApiClientError ? err.status : 0;
      toast.error(errorMessage(err, "Could not place your order"));
      if (Object.keys(fields).length) {
        setErrors(fields);
        const keys = Object.keys(fields);
        if (keys.some((k) => k.startsWith("contact"))) go(0);
        else if (keys.some((k) => k.startsWith("shippingAddress"))) go(1);
      } else if (status === 409 || status === 422) {
        await refreshCart();
        go(2);
      }
      return;
    }

    setPlaced(true);
    const { order, payment } = result;
    if (payment) {
      try {
        const outcome = await payWithRazorpay({ orderId: order._id, orderNumber: order.orderNumber, init: payment, storeName: settings.storeName });
        if (outcome.status === "paid") toast.success("Payment received");
        else if (outcome.status === "failed") toast.error(outcome.message);
      } catch (err) {
        toast.error(errorMessage(err, "Payment could not be started"), { description: "Your order is saved — you can retry payment." });
      }
    }
    router.push(`/checkout/success?order=${order._id}`);
    void refreshCart();
  }

  // ─── States ──────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center" role="status">
        <div>
          <Loader2 className="mx-auto size-8 animate-spin text-gold-500" />
          <p className="mt-4 font-display text-2xl text-charcoal">Finalising your order…</p>
          <p className="mt-1 text-sm text-stone">Please don&apos;t close this window.</p>
        </div>
      </div>
    );
  }

  if (cartLoading && !cart) return <CheckoutSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your bag is empty"
        description="Add a few pieces you love, then come back to check out."
        action={{ label: "Continue shopping", href: "/products" }}
      />
    );
  }

  const shown = totals ?? cart;
  const primaryLabel =
    step === 3 ? (method === "razorpay" ? `Pay ${formatPrice(shown.total)}` : "Place order") : step === 2 ? "Continue to payment" : "Continue";

  // ─── Steps ───────────────────────────────────────────────────────────
  const stepContent: ReactNode[] = [
    <StepCard key="contact" title="Contact information" subtitle="We'll send order updates here.">
      {!customer && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-gold-50/70 p-4 ring-1 ring-gold-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-ink">
            <UserRound className="size-4 text-gold-600" /> Have an account? Sign in for faster checkout.
          </p>
          <Link href="/login?next=/checkout" className="text-sm font-medium text-charcoal underline decoration-gold-300 underline-offset-4 hover:text-gold-700">
            Sign in
          </Link>
        </div>
      )}
      <form
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          advance();
        }}
        className="grid gap-5 sm:grid-cols-2"
      >
        <FormField label="Full name" htmlFor="co-name" error={errors["contact.name"]} required className="sm:col-span-2">
          <input
            id="co-name"
            autoComplete="name"
            className={inputClass}
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            aria-invalid={!!errors["contact.name"]}
          />
        </FormField>
        <FormField label="Email" htmlFor="co-email" error={errors["contact.email"]} required>
          <input
            id="co-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            aria-invalid={!!errors["contact.email"]}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="co-phone" error={errors["contact.phone"]} hint="For delivery updates on WhatsApp / SMS" required>
          <input
            id="co-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            className={inputClass}
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            aria-invalid={!!errors["contact.phone"]}
          />
        </FormField>
        <StepActions className="sm:col-span-2" primary="Continue to shipping" />
      </form>
    </StepCard>,

    <StepCard key="shipping" title="Shipping address" subtitle={`Delivered in ${settings.shipping.estimatedDelivery}.`}>
      {addresses.length > 0 && (
        <div role="radiogroup" aria-label="Saved addresses" className="mb-6 grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => {
            const selected = selectedAddress === a._id;
            return (
              <button
                key={a._id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedAddress(a._id)}
                className={cn(
                  "relative rounded-2xl border bg-card p-4 text-left transition",
                  selected ? "border-gold-400" : "border-border hover:border-gold-200",
                )}
              >
                {selected && (
                  <motion.span layoutId="address-selected" className="absolute inset-0 rounded-2xl bg-gold-50/60 ring-2 ring-gold-300" />
                )}
                <span className="relative flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">
                    {a.label || "Address"}
                    {a.isDefault && <span className="ml-2 text-gold-700">· Default</span>}
                  </span>
                  <span className={cn("grid size-5 place-items-center rounded-full border-2", selected ? "border-gold-500 bg-gold-500 text-white" : "border-input")}>
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </span>
                <span className="relative mt-2 block text-sm font-medium text-charcoal">{a.fullName}</span>
                <span className="relative mt-0.5 block text-sm leading-relaxed text-stone">
                  {a.line1}
                  {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}
                </span>
                <span className="relative mt-1 block text-xs text-stone">{a.phone}</span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={selectedAddress === "new"}
            onClick={() => setSelectedAddress("new")}
            className={cn(
              "relative grid min-h-32 place-items-center rounded-2xl border border-dashed p-4 text-sm font-medium transition",
              selectedAddress === "new" ? "border-gold-400 bg-gold-50/60 text-charcoal" : "border-gold-200 text-stone hover:border-gold-300 hover:text-charcoal",
            )}
          >
            <span className="flex items-center gap-2">
              <Plus className="size-4" /> Deliver to a new address
            </span>
          </button>
        </div>
      )}
      <form
        noValidate
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          advance();
        }}
      >
        <AnimatePresence initial={false}>
          {selectedAddress === "new" && (
            <motion.div
              key="new-address"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pb-1">
                <AddressFields
                  values={newAddress}
                  onChange={(p) => setNewAddress((v) => ({ ...v, ...p }))}
                  errors={addressErrors(errors, "shippingAddress.")}
                  idPrefix="ship"
                />
                {customer && (
                  <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-charcoal">
                    <Checkbox checked={saveAddress} onCheckedChange={(v) => setSaveAddress(v === true)} />
                    Save this address to my account
                  </label>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <StepActions className="mt-6" primary="Continue to review" onBack={() => go(0)} />
      </form>
    </StepCard>,

    <StepCard key="review" title="Review your order" subtitle="Check everything looks perfect.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Recap title="Contact" onEdit={() => go(0)}>
          <p className="font-medium text-charcoal">{contact.name}</p>
          <p>{contact.email}</p>
          <p>{contact.phone}</p>
        </Recap>
        <Recap title="Ship to" onEdit={() => go(1)}>
          <p className="font-medium text-charcoal">{shippingAddress.fullName}</p>
          <p>
            {shippingAddress.line1}
            {shippingAddress.line2 && `, ${shippingAddress.line2}`}
          </p>
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.pincode}
          </p>
        </Recap>
      </div>
      <div className="mt-6 rounded-2xl border border-border p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl text-charcoal">Items</h3>
          <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-stone transition hover:text-gold-700">
            <Pencil className="size-3.5" /> Edit bag
          </Link>
        </div>
        <CheckoutItems cart={cart} />
        {unavailable.length > 0 && (
          <p className="mt-4 rounded-xl bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {unavailable.map((i) => i.name).join(", ")} {unavailable.length > 1 ? "are" : "is"} out of stock. Please remove{" "}
            {unavailable.length > 1 ? "them" : "it"} from your bag.
          </p>
        )}
      </div>
      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone">Have a coupon?</p>
        <CouponInput />
      </div>
      <div className="mt-6 rounded-2xl bg-ivory p-4 sm:p-5">
        <CheckoutTotals totals={shown} refreshing={repricing} />
      </div>
      <StepActions className="mt-6" primary="Continue to payment" onPrimary={advance} onBack={() => go(1)} />
    </StepCard>,

    <StepCard key="payment" title="Payment" subtitle="Choose how you'd like to pay.">
      <PaymentOptions value={method} onChange={setMethod} onlineEnabled={paymentsEnabled} codEnabled={codEnabled} codFee={settings.shipping.codFee} />
      {!paymentsEnabled && !codEnabled && (
        <p className="mt-4 rounded-xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Checkout is temporarily unavailable. Please contact us at {settings.contact.email || settings.contact.phone}.
        </p>
      )}
      <FormField label="Order note" htmlFor="co-notes" hint="Optional — gift message or delivery instructions" className="mt-6">
        <textarea
          id="co-notes"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn(inputClass, "h-auto resize-none py-3")}
          placeholder="E.g. It's a gift — please don't include the invoice."
        />
      </FormField>
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-ivory p-4 sm:p-5">
        <span className="text-sm text-stone">Amount payable</span>
        <span className={cn("font-display text-3xl font-semibold tabular-nums text-charcoal transition-opacity", repricing && "opacity-50")}>
          {formatPrice(shown.total)}
        </span>
      </div>
      <StepActions
        className="mt-6"
        primary={primaryLabel}
        primaryIcon={<Lock className="size-4" />}
        onPrimary={advance}
        onBack={() => go(2)}
        loading={placing}
        disabled={!methodAvailable || repricing}
        gold
      />
      <p className="mt-4 text-center text-xs text-stone lg:text-left">
        By placing your order you agree to our shipping and returns policies.
      </p>
    </StepCard>,
  ];

  return (
    <div className="pb-32 lg:pb-0">
      <div className="mx-auto mb-8 max-w-2xl lg:mb-10">
        <CheckoutSteps current={step} onSelect={go} />
      </div>

      {/* Mobile collapsible summary */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="flex h-14 w-full items-center justify-between gap-3 px-4 text-sm"
        >
          <span className="flex items-center gap-2 text-charcoal">
            <ShoppingBag className="size-4 text-gold-600" />
            {summaryOpen ? "Hide" : "Show"} order summary
            <motion.span animate={{ rotate: summaryOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="size-4" />
            </motion.span>
          </span>
          <span className="font-semibold tabular-nums text-charcoal">{formatPrice(shown.total)}</span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="border-t border-border p-4 pt-5">
                <CheckoutItems cart={cart} />
                <div className="my-4 border-t border-border" />
                <CheckoutTotals totals={shown} refreshing={repricing} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start xl:gap-12">
        <div className="relative min-w-0">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: EASE }}
            >
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-stone">
                Step {step + 1} of {CHECKOUT_STEPS.length}
              </p>
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>
        </div>
        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <CheckoutSummary cart={cart} totals={shown} refreshing={repricing} />
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
            <Lock className="size-3.5 text-gold-600" /> Secure checkout · 7-day easy returns
          </p>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 lg:hidden">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              aria-label="Previous step"
              className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-card text-charcoal"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-stone">Total</p>
            <p className={cn("text-lg font-semibold tabular-nums text-charcoal transition-opacity", repricing && "opacity-50")}>
              {formatPrice(shown.total)}
            </p>
          </div>
          <Button
            variant={step === 3 ? "gold" : "default"}
            size="xl"
            onClick={advance}
            disabled={placing || (step === 3 && (!methodAvailable || repricing))}
            className="min-w-[52%] px-5"
          >
            {placing ? <Loader2 className="size-4 animate-spin" /> : step === 3 ? <Lock className="size-4" /> : null}
            <span className="truncate">{placing ? "Placing order…" : primaryLabel}</span>
            {!placing && step < 3 && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8">
      <h2 className="text-3xl text-charcoal">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-stone">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Desktop step buttons (mobile uses the sticky bottom bar). */
function StepActions({
  primary,
  primaryIcon,
  onPrimary,
  onBack,
  loading,
  disabled,
  gold,
  className,
}: {
  primary: string;
  primaryIcon?: ReactNode;
  onPrimary?: () => void;
  onBack?: () => void;
  loading?: boolean;
  disabled?: boolean;
  gold?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("hidden items-center justify-between gap-4 lg:flex", className)}>
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-stone transition hover:text-charcoal">
          <ArrowLeft className="size-4" /> Back
        </button>
      ) : (
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-stone transition hover:text-charcoal">
          <ArrowLeft className="size-4" /> Back to bag
        </Link>
      )}
      <Button
        type={onPrimary ? "button" : "submit"}
        onClick={onPrimary}
        variant={gold ? "gold" : "default"}
        size="xl"
        disabled={loading || disabled}
        className="min-w-56"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : primaryIcon}
        {loading ? "Placing order…" : primary}
        {!loading && !primaryIcon && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}

function Recap({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-stone">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">{title}</span>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-xs font-medium text-gold-700 hover:underline">
          <Pencil className="size-3" /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading checkout">
      <div className="mx-auto mb-10 flex max-w-2xl justify-between px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Shimmer className="size-9 rounded-full" />
            <Shimmer className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:gap-12">
        <div className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <Shimmer className="h-8 w-56" />
          <Shimmer className="h-4 w-72" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Shimmer key={i} className="h-12" />
            ))}
          </div>
          <Shimmer className="ml-auto h-12 w-56 rounded-full" />
        </div>
        <div className="hidden space-y-4 rounded-3xl border border-border bg-card p-6 lg:block">
          <Shimmer className="h-7 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="size-16" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-3 w-4/5" />
                <Shimmer className="h-3 w-1/3" />
              </div>
            </div>
          ))}
          <Shimmer className="h-32" />
        </div>
      </div>
    </div>
  );
}
