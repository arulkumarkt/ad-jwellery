import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "@/lib/api";
import { serializeAddress, serializeCustomer, serializeOrder } from "@/lib/serializers";
import { escapeRegex } from "@/lib/utils";
import { Address, Customer, Order, type CustomerDoc } from "@/models";
import type { AddressDTO, CustomerDTO, OrderDTO, Paginated } from "@/types";


export async function listCustomers(query: { q?: string; page?: number; pageSize?: number }): Promise<Paginated<CustomerDTO>> {
  await connectDB();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
  const filter: QueryFilter<CustomerDoc> = {};
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [docs, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Customer.countDocuments(filter),
  ]);
  const stats = await Order.aggregate<{ _id: Types.ObjectId; orderCount: number; totalSpent: number }>([
    { $match: { customer: { $in: docs.map((d) => d._id) } } },
    {
      $group: {
        _id: "$customer",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "returned"]] }, 0, "$total"] } },
      },
    },
  ]);
  const statMap = new Map(stats.map((s) => [String(s._id), s]));
  return {
    items: docs.map((d) => {
      const s = statMap.get(String(d._id));
      return { ...serializeCustomer(d), orderCount: s?.orderCount ?? 0, totalSpent: s?.totalSpent ?? 0 };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomerDetail(
  id: string,
): Promise<{ customer: CustomerDTO; orders: OrderDTO[]; addresses: AddressDTO[] } | null> {
  await connectDB();
  const doc = await Customer.findById(id).lean();
  if (!doc) return null;
  const [orders, addresses, agg] = await Promise.all([
    Order.find({ customer: doc._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Address.find({ customer: doc._id }).sort({ isDefault: -1 }).lean(),
    Order.aggregate<{ count: number; spent: number }>([
      { $match: { customer: doc._id } },
      { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "returned"]] }, 0, "$total"] } } } },
    ]),
  ]);
  return {
    customer: { ...serializeCustomer(doc), orderCount: agg[0]?.count ?? 0, totalSpent: agg[0]?.spent ?? 0 },
    orders: orders.map(serializeOrder),
    addresses: addresses.map(serializeAddress),
  };
}

export async function adminUpdateCustomer(
  id: string,
  input: { name?: string; phone?: string; isActive?: boolean },
): Promise<CustomerDTO> {
  await connectDB();
  const update: Record<string, unknown> = { ...input };
  // Disabling an account also revokes its sessions.
  const ops: Record<string, unknown> = { $set: update };
  if (input.isActive === false) ops.$inc = { sessionVersion: 1 };
  const doc = await Customer.findByIdAndUpdate(id, ops, { returnDocument: "after", runValidators: true }).lean();
  if (!doc) throw new ApiError("Customer not found", 404);
  return serializeCustomer(doc);
}

