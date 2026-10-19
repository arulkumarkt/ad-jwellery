import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { homeSectionInputSchema } from "@/lib/validators";
import { deleteSection, updateSection } from "@/services/home.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  return ok(await updateSection(id, await parseJson(req, homeSectionInputSchema)));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteSection(assertObjectId((await params).id));
  return ok({ deleted: true });
});
