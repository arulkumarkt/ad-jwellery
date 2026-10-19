import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { getVerifiedCustomer } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const customer = await getVerifiedCustomer();
  if (!customer) redirect("/login?next=/account");
  const initials = customer.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="container-lux pb-20 pt-6 sm:pt-10">
      <div className="mb-6 flex items-center gap-4 sm:mb-8">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold-gradient font-display text-xl font-semibold text-charcoal shadow-soft sm:size-14">
          {initials || "S"}
        </span>
        <div className="min-w-0">
          <p className="eyebrow">My account</p>
          <p className="truncate font-display text-2xl text-charcoal sm:text-3xl">{customer.name}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
