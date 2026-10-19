import { handler, ok } from "@/lib/api";
import { logoutAdmin } from "@/services/auth.service";

export const POST = handler(async () => {
  await logoutAdmin();
  return ok({ signedOut: true });
});
