import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteReview, setReviewApproval } from "@/services/review.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  const { isApproved } = await parseJson(req, z.object({ isApproved: z.boolean() }));
  await setReviewApproval(id, isApproved);
  return ok({ updated: true });
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteReview(assertObjectId((await params).id));
  return ok({ deleted: true });
});
