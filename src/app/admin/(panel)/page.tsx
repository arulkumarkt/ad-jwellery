import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboard.service";
import { DashboardView } from "@/components/admin/dashboard-view";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const stats = await getDashboardStats(30);
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(now);
  return <DashboardView initial={stats} adminName={admin.name} greeting={greeting} today={today} />;
}
