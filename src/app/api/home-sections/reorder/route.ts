import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { reorderSchema } from "@/lib/validators";
import { reorderSections } from "@/services/home.service";

export const PUT = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  const { ids } = await parseJson(req, reorderSchema);
  await reorderSections(ids);
  return ok({ reordered: ids.length });
});
