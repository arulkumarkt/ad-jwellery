import type { NextRequest } from "next/server";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireCustomer } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validators";
import { createReview, getProductReviews } from "@/services/review.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (req: NextRequest, { params }: Ctx) => {
  const id = assertObjectId((await params).id);
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  return ok(await getProductReviews(id, page));
});

export const POST = handler(async (req: NextRequest, { params }: Ctx) => {
  const customer = await requireCustomer();
  await rateLimit("review", 10, 60 * 60 * 1000);
  const id = assertObjectId((await params).id);
  const input = await parseJson(req, reviewSchema);
  return ok(await createReview(customer, id, input), { status: 201 });
});
