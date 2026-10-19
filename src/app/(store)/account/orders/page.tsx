import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NoOrdersState } from "@/components/account/empty-states";
import { OrderCard } from "@/components/account/order-card";
import { Pagination } from "@/components/common/pagination";
import { Stagger, StaggerItem } from "@/components/motion";
import { getVerifiedCustomer } from "@/lib/auth";
import { listCustomerOrders } from "@/services/order.service";

export const metadata: Metadata = { title: "My orders" };

const PAGE_SIZE = 8;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const customer = await getVerifiedCustomer();
  if (!customer) redirect("/login?next=/account/orders");
  const page = Math.max(1, Math.floor(Number((await searchParams).page)) || 1);
  const orders = await listCustomerOrders(customer.id, page, PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <span className="eyebrow">Order history</span>
        <h1 className="mt-2 text-3xl text-charcoal sm:text-4xl">My orders</h1>
        {orders.total > 0 && (
          <p className="mt-1 text-sm text-stone">
            {orders.total} order{orders.total === 1 ? "" : "s"} placed
          </p>
        )}
      </div>
      {orders.items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card">
          <NoOrdersState />
        </div>
      ) : (
        <>
          <Stagger key={page} className="grid gap-4 xl:grid-cols-2">
            {orders.items.map((o) => (
              <StaggerItem key={o._id}>
                <OrderCard order={o} />
              </StaggerItem>
            ))}
          </Stagger>
          <Pagination
            className="mt-10"
            page={orders.page}
            totalPages={orders.totalPages}
            hrefFor={(p) => (p === 1 ? "/account/orders" : `/account/orders?page=${p}`)}
          />
        </>
      )}
    </div>
  );
}
