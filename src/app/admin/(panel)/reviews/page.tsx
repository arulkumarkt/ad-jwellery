import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAllReviews } from "@/services/review.service";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { Pagination } from "@/components/common/pagination";
import { hasRole } from "@/components/admin/admin-roles";

export const metadata = { title: "Reviews" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminReviewsPage({ searchParams }: { searchParams: SP }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const data = await listAllReviews(page, 30);
  const pending = data.items.filter((r) => !r.isApproved).length;

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Reviews"
        description={`${data.total} review${data.total === 1 ? "" : "s"}${pending ? ` · ${pending} hidden on this page` : ""}. Hidden reviews don't appear on the storefront or count towards ratings.`}
      />
      <ReviewsTable reviews={data.items} canEdit={hasRole(admin.role, "manager")} />
      <Pagination
        className="mt-8"
        page={data.page}
        totalPages={data.totalPages}
        hrefFor={(p) => (p > 1 ? `/admin/reviews?page=${p}` : "/admin/reviews")}
      />
    </div>
  );
}
