import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireCustomer } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validators";
import { changePassword } from "@/services/account.service";

export const PUT = handler(async (req: NextRequest) => {
  const customer = await requireCustomer();
  await rateLimit("password", 5, 15 * 60 * 1000);
  const { currentPassword, newPassword } = await parseJson(req, changePasswordSchema);
  await changePassword(customer.id, currentPassword, newPassword);
  return ok({ updated: true });
});
