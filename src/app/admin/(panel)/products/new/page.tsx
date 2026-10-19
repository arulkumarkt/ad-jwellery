import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAllCategories } from "@/services/category.service";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const categories = await listAllCategories();
  return (
    <div>
      <PageHeader
        back={{ href: "/admin/products", label: "All products" }}
        eyebrow="Catalogue"
        title="New product"
        description="Add a new piece to the Swarnika collection."
      />
      <ProductForm product={null} categories={categories} />
    </div>
  );
}
