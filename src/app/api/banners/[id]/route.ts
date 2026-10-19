import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { bannerInputSchema } from "@/lib/validators";
import { deleteBanner, updateBanner } from "@/services/home.service";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  return ok(await updateBanner(id, await parseJson(req, bannerInputSchema)));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteBanner(assertObjectId((await params).id));
  return ok({ deleted: true });
});
