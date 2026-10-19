import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminSession } from "@/lib/auth";
import { getProductById } from "@/services/product.service";
import { listAllCategories } from "@/services/category.service";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Pill } from "@/components/admin/status-badge";

type Params = Promise<{ id: string }>;
const isObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = isObjectId(id) ? await getProductById(id) : null;
  return { title: product ? `Edit ${product.name}` : "Product" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const [product, categories] = await Promise.all([getProductById(id), listAllCategories()]);
  if (!product) notFound();
  return (
    <div>
      <PageHeader
        back={{ href: "/admin/products", label: "All products" }}
        eyebrow={`SKU ${product.sku}`}
        title={product.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {product.isActive ? <Pill tone="success">Active</Pill> : <Pill>Hidden</Pill>}
            <span>Last updated {new Date(product.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</span>
          </span>
        }
      />
      <ProductForm key={product.updatedAt} product={product} categories={categories} />
    </div>
  );
}
