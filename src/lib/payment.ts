import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./api";
import { env, paymentsEnabled } from "./env";

/**
 * Minimal Razorpay integration over REST (no SDK). The secret key never leaves
 * the server; the browser only receives the public key id and provider order id.
 */
export interface ProviderOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createProviderOrder(amountInRupees: number, receipt: string): Promise<ProviderOrder> {
  if (!paymentsEnabled()) throw new ApiError("Online payments are not configured", 503);
  const auth = Buffer.from(`${env.paymentPublicKey}:${env.paymentSecretKey}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountInRupees * 100), currency: "INR", receipt }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[payment] provider order failed", res.status, await res.text().catch(() => ""));
    throw new ApiError("Could not start the payment. Please try again.", 502);
  }
  const data = (await res.json()) as ProviderOrder;
  return { id: data.id, amount: data.amount, currency: data.currency };
}

export function verifyPaymentSignature(providerOrderId: string, paymentId: string, signature: string): boolean {
  if (!env.paymentSecretKey) return false;
  const expected = createHmac("sha256", env.paymentSecretKey).update(`${providerOrderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function publicPaymentKey(): string | null {
  return paymentsEnabled() ? env.paymentPublicKey : null;
}
