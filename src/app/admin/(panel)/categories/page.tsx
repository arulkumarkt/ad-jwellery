import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAllCategories } from "@/services/category.service";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { hasRole } from "@/components/admin/admin-roles";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const categories = await listAllCategories();
  return <CategoriesManager categories={categories} canEdit={hasRole(admin.role, "manager")} />;
}
