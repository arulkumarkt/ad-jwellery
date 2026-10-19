"use client";

import { api } from "@/lib/fetcher";
import type { OrderDTO } from "@/types";

/** Payment bootstrap returned by POST /api/orders and /api/orders/:id/payment. */
export interface PaymentInit {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
}

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

interface RazorpayFailure {
  error: { code?: string; description?: string; reason?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: RazorpayFailure) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

/** Loads Razorpay Checkout once, on demand. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Payments need a browser"));
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = SCRIPT_SRC;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => {
        scriptPromise = null;
        el.remove();
        reject(new Error("Could not load the payment window. Check your connection and try again."));
      };
      document.body.appendChild(el);
    });
  }
  return scriptPromise;
}

export type PaymentOutcome =
  | { status: "paid"; order: OrderDTO }
  | { status: "dismissed" }
  | { status: "failed"; message: string };

/**
 * Opens Razorpay Checkout for an order and verifies the signature server-side.
 * Resolves once the shopper pays, closes the window, or verification fails.
 */
export async function payWithRazorpay({
  orderId,
  orderNumber,
  init,
  storeName,
}: {
  orderId: string;
  orderNumber: string;
  init: PaymentInit;
  storeName: string;
}): Promise<PaymentOutcome> {
  await loadRazorpay();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Payment window unavailable");

  return new Promise<PaymentOutcome>((resolve) => {
    let lastError: string | null = null;
    let settled = false;
    const settle = (o: PaymentOutcome) => {
      if (settled) return;
      settled = true;
      resolve(o);
    };
    const rzp = new Razorpay({
      key: init.keyId,
      amount: init.amount,
      currency: init.currency,
      order_id: init.providerOrderId,
      name: storeName,
      description: `Order #${orderNumber}`,
      prefill: { name: init.name, email: init.email, contact: init.phone },
      notes: { orderNumber },
      theme: { color: "#b48536" },
      handler: (resp) => {
        api<OrderDTO>("/api/payments/verify", {
          body: {
            orderId,
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
          },
        })
          .then((order) => settle({ status: "paid", order }))
          .catch((err: unknown) =>
            settle({ status: "failed", message: err instanceof Error ? err.message : "Payment verification failed" }),
          );
      },
      modal: {
        ondismiss: () => settle(lastError ? { status: "failed", message: lastError } : { status: "dismissed" }),
      },
    });
    rzp.on("payment.failed", (resp) => {
      lastError = resp.error.description || "Payment failed";
    });
    rzp.open();
  });
}
