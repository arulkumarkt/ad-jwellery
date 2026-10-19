import type { NextRequest } from "next/server";
import { ApiError, assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { customerAdminUpdateSchema } from "@/lib/validators";
import { adminUpdateCustomer, getCustomerDetail } from "@/services/customer.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const detail = await getCustomerDetail(assertObjectId((await params).id));
  if (!detail) throw new ApiError("Customer not found", 404);
  return ok(detail);
});

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  return ok(await adminUpdateCustomer(id, await parseJson(req, customerAdminUpdateSchema)));
});
