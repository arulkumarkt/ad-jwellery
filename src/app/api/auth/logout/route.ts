import { handler, ok } from "@/lib/api";
import { logoutCustomer } from "@/services/auth.service";

export const POST = handler(async () => {
  await logoutCustomer();
  return ok({ signedOut: true });
});
