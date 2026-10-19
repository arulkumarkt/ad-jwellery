import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getSettings } from "@/services/settings.service";
import { SettingsForm } from "@/components/admin/settings-form";
import { hasRole } from "@/components/admin/admin-roles";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const settings = await getSettings();
  return <SettingsForm settings={settings} canEdit={hasRole(admin.role, "owner")} />;
}
