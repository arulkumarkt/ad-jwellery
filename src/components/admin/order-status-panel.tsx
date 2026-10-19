"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoaderCircle, Printer, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { api } from "@/lib/fetcher";
import type { OrderStatus, PaymentStatus } from "@/types";
import { adminInput, adminSelect, adminTextarea, notifyError } from "./admin-utils";
import { capitalize } from "./status-badge";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-charcoal transition hover:border-gold-300 print:hidden"
    >
      <Printer className="size-4" /> Print
    </button>
  );
}

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

export function OrderStatusPanel({
  orderId,
  status,
  allowed,
  paymentStatus,
  trackingNumber,
}: {
  orderId: string;
  status: OrderStatus;
  allowed: OrderStatus[];
  paymentStatus: PaymentStatus;
  trackingNumber: string;
}) {
  const router = useRouter();
  const [next, setNext] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState(trackingNumber);
  const [payment, setPayment] = useState<PaymentStatus>(paymentStatus);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const changed = next !== status || note.trim() !== "" || tracking !== trackingNumber || payment !== paymentStatus;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: {
          status: next,
          note: note.trim(),
          ...(tracking !== trackingNumber ? { trackingNumber: tracking.trim() } : {}),
          ...(payment !== paymentStatus ? { paymentStatus: payment } : {}),
        },
      });
      toast.success(next !== status ? `Order marked ${next}` : "Order updated");
      setNote("");
      router.refresh();
    } catch (err) {
      setErrors(notifyError(err, "Couldn't update order"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gold-200 bg-white p-5 shadow-soft print:hidden">
      <h3 className="flex items-center gap-2 font-display text-xl text-charcoal">
        <RefreshCcw className="size-4 text-gold-600" /> Update order
      </h3>
      <div className="mt-4 flex flex-col gap-4">
        <FormField label="Status" htmlFor="o-status" error={errors.status}>
          <select
            id="o-status"
            className={adminSelect}
            value={next}
            onChange={(e) => setNext(e.target.value as OrderStatus)}
            disabled={allowed.length === 0}
          >
            <option value={status}>{capitalize(status)} (current)</option>
            {allowed.map((s) => (
              <option key={s} value={s}>
                → {capitalize(s)}
              </option>
            ))}
          </select>
        </FormField>
        {allowed.length === 0 && <p className="-mt-2 text-xs text-stone">This order is closed; no further status changes.</p>}
        {(next === "cancelled" || next === "returned") && next !== status && (
          <p className="-mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
            Stock will be returned to inventory{next === "cancelled" ? " and coupon usage released" : ""}.
          </p>
        )}
        <FormField label="Tracking number" htmlFor="o-track" error={errors.trackingNumber}>
          <input
            id="o-track"
            className={`${adminInput} font-mono`}
            value={tracking}
            maxLength={80}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="AWB / courier reference"
          />
        </FormField>
        <FormField label="Payment status" htmlFor="o-pay" error={errors.paymentStatus}>
          <select
            id="o-pay"
            className={adminSelect}
            value={payment}
            onChange={(e) => setPayment(e.target.value as PaymentStatus)}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {capitalize(s)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Note" htmlFor="o-note" error={errors.note} hint="Added to the order timeline.">
          <textarea
            id="o-note"
            className={`${adminTextarea} min-h-20`}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Packed and handed to Blue Dart"
          />
        </FormField>
        <button
          type="submit"
          disabled={saving || !changed}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-charcoal text-sm font-medium text-ivory transition hover:bg-gold-700 disabled:opacity-50"
        >
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          Save update
        </button>
      </div>
    </form>
  );
}
