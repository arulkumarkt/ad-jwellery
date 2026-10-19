import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listCoupons } from "@/services/coupon.service";
import { CouponsManager } from "@/components/admin/coupons-manager";
import { hasRole } from "@/components/admin/admin-roles";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const data = await listCoupons(1, 200);
  return <CouponsManager coupons={data.items} canEdit={hasRole(admin.role, "manager")} now={new Date().getTime()} />;
}
