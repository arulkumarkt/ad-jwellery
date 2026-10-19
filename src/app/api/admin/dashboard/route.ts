import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboard.service";

export const GET = handler(async (req: NextRequest) => {
  await requireAdmin();
  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 30));
  return ok(await getDashboardStats(days));
});
