import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { categoryInputSchema } from "@/lib/validators";
import { createCategory, getCategoryTree, listAllCategories } from "@/services/category.service";

/** GET /api/categories — active category tree; `?scope=admin` returns every category (flat). */
export const GET = handler(async (req: NextRequest) => {
  if (req.nextUrl.searchParams.get("scope") === "admin") {
    await requireAdmin();
    return ok(await listAllCategories());
  }
  return ok(await getCategoryTree());
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  const input = await parseJson(req, categoryInputSchema);
  return ok(await createCategory(input), { status: 201 });
});
