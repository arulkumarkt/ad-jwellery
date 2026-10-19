"use client";

import { Users } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { CustomerDTO } from "@/types";
import { DataTable, type Column } from "./data-table";
import { SearchInput } from "./search-input";
import { Pill } from "./status-badge";

export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

const columns: Column<CustomerDTO>[] = [
  {
    key: "name",
    header: "Customer",
    cell: (c) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-50 text-xs font-semibold text-gold-700 ring-1 ring-gold-200">
          {initials(c.name)}
        </span>
        <div className="min-w-0">
          <p className="max-w-52 truncate font-medium text-charcoal">{c.name}</p>
          <p className="max-w-52 truncate text-xs text-stone">{c.email}</p>
        </div>
      </div>
    ),
  },
  { key: "phone", header: "Phone", cell: (c) => <span className="text-sm text-stone">{c.phone || "—"}</span> },
  { key: "joined", header: "Joined", cell: (c) => <span className="whitespace-nowrap text-sm text-stone">{formatDate(c.createdAt)}</span> },
  { key: "orders", header: "Orders", cell: (c) => <span className="tabular-nums text-charcoal">{c.orderCount ?? 0}</span> },
  {
    key: "spent",
    header: "Total spent",
    cell: (c) => <span className="font-semibold tabular-nums text-charcoal">{formatPrice(c.totalSpent ?? 0)}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (c) => (c.isActive ? <Pill tone="success">Active</Pill> : <Pill tone="danger">Disabled</Pill>),
  },
];

export function CustomersTable({ customers }: { customers: CustomerDTO[] }) {
  return (
    <>
      <div className="mb-5 flex justify-end">
        <SearchInput placeholder="Search name, email or phone…" />
      </div>
      <DataTable
        columns={columns}
        rows={customers}
        rowKey={(c) => c._id}
        rowHref={(c) => `/admin/customers/${c._id}`}
        empty={{ icon: Users, title: "No customers found", description: "Customers appear here once they create an account." }}
      />
    </>
  );
}
