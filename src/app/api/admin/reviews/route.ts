import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { listAllReviews } from "@/services/review.service";

export const GET = handler(async (req: NextRequest) => {
  await requireAdmin();
  return ok(await listAllReviews(Number(req.nextUrl.searchParams.get("page")) || 1));
});
