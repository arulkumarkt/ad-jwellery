import type { NextRequest } from "next/server";
import { handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { bannerInputSchema } from "@/lib/validators";
import { createBanner, getBanners, listAllBanners } from "@/services/home.service";

/** GET /api/banners?placement=hero — live banners; `?scope=admin` lists all. */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  if (sp.get("scope") === "admin") {
    await requireAdmin();
    return ok(await listAllBanners());
  }
  const placement = sp.get("placement");
  return ok(await getBanners(placement === "promo" || placement === "strip" ? placement : "hero"));
});

export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  return ok(await createBanner(await parseJson(req, bannerInputSchema)), { status: 201 });
});
