import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireCustomer } from "@/lib/auth";
import { addressSchema } from "@/lib/validators";
import { deleteAddress, updateAddress } from "@/services/account.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  const customer = await requireCustomer();
  const id = assertObjectId((await params).id);
  return ok(await updateAddress(customer.id, id, await parseJson(req, addressSchema)));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const customer = await requireCustomer();
  await deleteAddress(customer.id, assertObjectId((await params).id));
  return ok({ deleted: true });
});
