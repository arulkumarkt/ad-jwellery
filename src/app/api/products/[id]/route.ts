import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { ApiError, assertObjectId, handler, ok, parseJson } from "@/lib/api";
import { getAdminSession, requireAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validators";
import { deleteProduct, getProductById, getProductBySlug, updateProduct } from "@/services/product.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/products/:id — accepts an ObjectId or a slug. Inactive products are admin-only. */
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  if (mongoose.isValidObjectId(id)) {
    const product = await getProductById(id);
    if (!product || (!product.isActive && !(await getAdminSession()))) throw new ApiError("Product not found", 404);
    return ok(product);
  }
  const product = await getProductBySlug(id);
  if (!product) throw new ApiError("Product not found", 404);
  return ok(product);
});

export const PUT = handler(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  const id = assertObjectId((await params).id);
  const input = await parseJson(req, productInputSchema);
  return ok(await updateProduct(id, input));
});

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin("manager");
  await deleteProduct(assertObjectId((await params).id));
  return ok({ deleted: true });
});
