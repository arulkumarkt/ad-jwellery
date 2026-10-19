import type { NextRequest } from "next/server";
import { ApiError, handler, ok, parseJson } from "@/lib/api";
import { getAdminSession, getOwner, getVerifiedCustomer } from "@/lib/auth";
import { rememberLastOrder } from "@/lib/last-order";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validators";
import { ORDER_STATUSES, type OrderStatus } from "@/models";
import { listCustomerOrders, listOrders, placeOrder } from "@/services/order.service";

/** POST /api/orders — place an order from the current bag. Prices are recomputed server-side. */
export const POST = handler(async (req: NextRequest) => {
  await rateLimit("checkout", 10, 10 * 60 * 1000);
  const input = await parseJson(req, checkoutSchema);
  const customer = await getVerifiedCustomer();
  const owner = customer ? { customerId: customer.id, guestId: null } : await getOwner();
  const result = await placeOrder(owner, input);
  await rememberLastOrder(result.order._id);
  return ok(result, { status: 201 });
});

/** GET /api/orders — admins see all orders (filterable); customers see their own. */
export const GET = handler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  if (sp.get("scope") === "admin") {
    if (!(await getAdminSession())) throw new ApiError("Admin authentication required", 401);
    const status = sp.get("status");
    return ok(
      await listOrders({
        q: sp.get("q") ?? undefined,
        status: ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined,
        customer: sp.get("customer") ?? undefined,
        page,
        pageSize: Number(sp.get("pageSize")) || 20,
      }),
    );
  }
  const customer = await getVerifiedCustomer();
  if (!customer) throw new ApiError("Please sign in to view your orders", 401);
  return ok(await listCustomerOrders(customer.id, page));
});
