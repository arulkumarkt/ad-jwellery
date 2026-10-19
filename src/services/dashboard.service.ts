import "server-only";
import { connectDB } from "@/lib/mongodb";
import { serializeOrder } from "@/lib/serializers";
import { Customer, Order, Product } from "@/models";
import type { DashboardStatsDTO, OrderStatus } from "@/types";

const REVENUE_MATCH = { status: { $nin: ["cancelled", "returned"] } };

export async function getDashboardStats(days = 30): Promise<DashboardStatsDTO> {
  await connectDB();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [sales, totalOrders, totalCustomers, totalProducts, pendingOrders, lowStock, recent, best, byDay, statuses] =
    await Promise.all([
      Order.aggregate<{ total: number }>([{ $match: REVENUE_MATCH }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ status: { $in: ["pending", "confirmed", "processing"] } }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate<{ _id: string; name: string; slug: string; image: string; sold: number; revenue: number }>([
        { $match: REVENUE_MATCH },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            slug: { $first: "$items.slug" },
            image: { $first: "$items.image" },
            sold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 6 },
      ]),
      Order.aggregate<{ _id: string; sales: number; orders: number }>([
        { $match: { ...REVENUE_MATCH, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
            sales: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate<{ _id: OrderStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

  const dayMap = new Map(byDay.map((d) => [d._id, d]));
  const salesByDay: DashboardStatsDTO["salesByDay"] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    const hit = dayMap.get(key);
    salesByDay.push({ date: key, sales: hit?.sales ?? 0, orders: hit?.orders ?? 0 });
  }

  return {
    totalSales: sales[0]?.total ?? 0,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockProducts: lowStock,
    recentOrders: recent.map(serializeOrder),
    bestSellers: best.map((b) => ({ ...b, _id: String(b._id) })),
    salesByDay,
    statusBreakdown: statuses.map((s) => ({ status: s._id, count: s.count })),
  };
}
