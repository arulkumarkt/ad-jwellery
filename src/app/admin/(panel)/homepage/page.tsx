import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAllBanners, listAllSections } from "@/services/home.service";
import { listAllCategories } from "@/services/category.service";
import { getProductCardsByIds } from "@/services/product.service";
import { HomepageManager } from "@/components/admin/homepage-manager";
import { hasRole } from "@/components/admin/admin-roles";
import type { PickedProduct } from "@/components/admin/product-picker";

export const metadata = { title: "Homepage" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminHomepagePage({ searchParams }: { searchParams: SP }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const [banners, sections, categories] = await Promise.all([listAllBanners(), listAllSections(), listAllCategories()]);
  const ids = [...new Set(sections.flatMap((s) => s.productIds))];
  const cards = ids.length ? await getProductCardsByIds(ids, false) : [];
  const productMap: Record<string, PickedProduct> = Object.fromEntries(
    cards.map((p) => [p._id, { _id: p._id, name: p.name, image: p.image?.thumbnail || p.image?.url || "", price: p.price }]),
  );

  return (
    <HomepageManager
      initialTab={sp.tab === "sections" ? "sections" : "banners"}
      banners={banners}
      sections={sections}
      categories={categories}
      productMap={productMap}
      canEdit={hasRole(admin.role, "manager")}
      now={new Date().getTime()}
    />
  );
}
