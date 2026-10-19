import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { homeSectionInputSchema } from "@/lib/validators";
import { createSection, getHomeSections, listAllSections } from "@/services/home.service";

/** GET /api/home-sections — resolved homepage sections; `?scope=admin` lists raw sections. */
export const GET = handler(async (req: NextRequest) => {
  if (req.nextUrl.searchParams.get("scope") === "admin") {
    await requireAdmin();
    return ok(await listAllSections());
  }
  return ok(await getHomeSections());
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  return ok(await createSection(await parseJson(req, homeSectionInputSchema)), { status: 201 });
});
