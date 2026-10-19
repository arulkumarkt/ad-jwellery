import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireCustomer } from "@/lib/auth";
import { addressSchema } from "@/lib/validators";
import { createAddress, listAddresses } from "@/services/account.service";

export const GET = handler(async () => {
  const customer = await requireCustomer();
  return ok(await listAddresses(customer.id));
});

export const POST = handler(async (req: NextRequest) => {
  const customer = await requireCustomer();
  return ok(await createAddress(customer.id, await parseJson(req, addressSchema)), { status: 201 });
});
