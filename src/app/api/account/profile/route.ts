import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireCustomer } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";
import { getProfile, updateProfile } from "@/services/account.service";

export const GET = handler(async () => {
  const customer = await requireCustomer();
  return ok(await getProfile(customer.id));
});

export const PUT = handler(async (req: NextRequest) => {
  const customer = await requireCustomer();
  return ok(await updateProfile(customer.id, await parseJson(req, profileSchema)));
});
