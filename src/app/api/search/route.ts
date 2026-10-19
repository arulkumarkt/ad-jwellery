import type { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { searchSuggestions } from "@/services/product.service";

/** GET /api/search?q= — instant suggestions for the search overlay. */
export const GET = handler(async (req: NextRequest) => {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  return ok(await searchSuggestions(q));
});
