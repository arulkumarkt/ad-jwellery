"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { payWithRazorpay, type PaymentInit } from "./razorpay";

/** Starts a fresh Razorpay attempt for an unpaid online order. */
export function RetryPaymentButton({
  orderId,
  orderNumber,
  storeName,
  className,
  label = "Complete payment",
}: {
  orderId: string;
  orderNumber: string;
  storeName: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function retry() {
    setPending(true);
    try {
      const init = await api<PaymentInit>(`/api/orders/${orderId}/payment`, { method: "POST" });
      const outcome = await payWithRazorpay({ orderId, orderNumber, init, storeName });
      if (outcome.status === "paid") {
        toast.success("Payment received — thank you!");
        router.refresh();
      } else if (outcome.status === "failed") {
        toast.error(outcome.message);
        router.refresh();
      } else {
        toast("Payment not completed", { description: "Your order is saved. You can pay any time." });
      }
    } catch (err) {
      toast.error(errorMessage(err, "Could not start the payment"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="gold" size="xl" onClick={retry} disabled={pending} className={cn("w-full sm:w-auto", className)}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
      {pending ? "Opening secure payment…" : label}
    </Button>
  );
}
