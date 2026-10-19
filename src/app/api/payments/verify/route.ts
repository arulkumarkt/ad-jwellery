import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { paymentVerifySchema } from "@/lib/validators";
import { confirmPayment } from "@/services/order.service";

/** POST /api/payments/verify — verifies the Razorpay signature server-side and marks the order paid. */
export const POST = handler(async (req: NextRequest) => {
  const input = await parseJson(req, paymentVerifySchema);
  return ok(await confirmPayment(input));
});
