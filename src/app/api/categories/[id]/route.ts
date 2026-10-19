import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { categoryInputSchema } from "@/lib/validators";
import { deleteCategory, updateCategory } from "@/services/category.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  return ok(await updateCategory(id, await parseJson(req, categoryInputSchema)));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteCategory(assertObjectId((await params).id));
  return ok({ deleted: true });
});
