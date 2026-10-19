import type { NextRequest } from "next/server";
import { handler, ok, parseJson, searchParamsObject } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { productInputSchema, productQuerySchema } from "@/lib/validators";
import { createProduct, listAdminProducts, listProducts } from "@/services/product.service";

/** GET /api/products — public catalogue listing with filters, sort and pagination. */
export const GET = handler(async (req: NextRequest) => {
  const params = searchParamsObject(req);
  if (params.scope === "admin") {
    await requireAdmin();
    const status = ["active", "inactive", "low-stock", "out-of-stock"].includes(params.status ?? "")
      ? (params.status as "active")
      : undefined;
    return ok(
      await listAdminProducts({
        q: params.q,
        category: params.category,
        status,
        page: Number(params.page) || 1,
        pageSize: Number(params.pageSize) || 20,
      }),
    );
  }
  const filters = productQuerySchema.parse(params);
  return ok(await listProducts(filters));
});

/** POST /api/products — admin: create a product. */
export const POST = handler(async (req: NextRequest) => {
  await requireAdmin("manager");
  const input = await parseJson(req, productInputSchema);
  return ok(await createProduct(input), { status: 201 });
});
