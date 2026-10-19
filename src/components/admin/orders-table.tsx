"use client";

import { ShoppingBag } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { OrderDTO } from "@/types";
import { DataTable, type Column } from "./data-table";
import { FilterTabs, type FilterOption } from "./filter-tabs";
import { SearchInput } from "./search-input";
import { StatusBadge } from "./status-badge";

export const orderColumns: Column<OrderDTO>[] = [
  {
    key: "order",
    header: "Order",
    cell: (o) => <span className="font-semibold text-charcoal">#{o.orderNumber}</span>,
  },
  {
    key: "date",
    header: "Date",
    cell: (o) => (
      <div className="whitespace-nowrap text-xs">
        <p className="text-charcoal">{formatDate(o.createdAt)}</p>
        <p className="text-stone">
          {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}
        </p>
      </div>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    cell: (o) => (
      <div className="max-w-52">
        <p className="truncate text-charcoal">{o.contact.name}</p>
        <p className="truncate text-xs text-stone">{o.contact.phone || o.contact.email}</p>
      </div>
    ),
  },
  {
    key: "items",
    header: "Items",
    cell: (o) => {
      const qty = o.items.reduce((s, i) => s + i.quantity, 0);
      return (
        <span className="text-sm tabular-nums text-stone">
          {qty} item{qty === 1 ? "" : "s"}
        </span>
      );
    },
  },
  {
    key: "total",
    header: "Total",
    cell: (o) => <span className="font-semibold tabular-nums text-charcoal">{formatPrice(o.total)}</span>,
  },
  {
    key: "payment",
    header: "Payment",
    cell: (o) => (
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone">
          {o.payment.method === "cod" ? "COD" : "Online"}
        </span>
        <StatusBadge status={o.payment.status} kind="payment" />
      </div>
    ),
  },
  { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
];

export function OrdersTable({ orders, tabs }: { orders: OrderDTO[]; tabs: FilterOption[] }) {
  return (
    <>
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterTabs options={tabs} layoutId="order-status" />
        <SearchInput placeholder="Order #, name, email, phone…" />
      </div>
      <DataTable
        columns={orderColumns}
        rows={orders}
        rowKey={(o) => o._id}
        rowHref={(o) => `/admin/orders/${o._id}`}
        empty={{ icon: ShoppingBag, title: "No orders found", description: "Try another status or search term." }}
      />
    </>
  );
}

/** Compact order history (no customer column) used on the customer profile. */
export function CustomerOrdersTable({ orders }: { orders: OrderDTO[] }) {
  return (
    <DataTable
      columns={orderColumns.filter((c) => c.key !== "customer")}
      rows={orders}
      rowKey={(o) => o._id}
      rowHref={(o) => `/admin/orders/${o._id}`}
      empty={{ icon: ShoppingBag, title: "No orders yet", description: "This customer hasn't placed an order." }}
      dense
    />
  );
}
