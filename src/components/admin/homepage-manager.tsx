"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ImageIcon, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BannerDTO, CategoryDTO, HomeSectionDTO } from "@/types";
import { BannersPanel } from "./banners-panel";
import { PageHeader } from "./page-header";
import type { PickedProduct } from "./product-picker";
import { SectionsPanel } from "./sections-panel";

type Tab = "banners" | "sections";

export function HomepageManager({
  initialTab,
  banners,
  sections,
  categories,
  productMap,
  canEdit,
  now,
}: {
  initialTab: Tab;
  banners: BannerDTO[];
  sections: HomeSectionDTO[];
  categories: CategoryDTO[];
  productMap: Record<string, PickedProduct>;
  canEdit: boolean;
  now: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(initialTab);

  function select(t: Tab) {
    setTab(t);
    router.replace(t === "banners" ? pathname : `${pathname}?tab=${t}`, { scroll: false });
  }

  const tabs: { value: Tab; label: string; icon: typeof ImageIcon; count: number }[] = [
    { value: "banners", label: "Banners", icon: ImageIcon, count: banners.length },
    { value: "sections", label: "Sections", icon: LayoutGrid, count: sections.length },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Homepage"
        description="Curate hero banners, promotions, featured products, categories and every homepage section."
        actions={
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-charcoal transition hover:border-gold-300"
          >
            <ExternalLink className="size-4" /> Preview
          </Link>
        }
      />
      <div className="mb-6 border-b border-border">
        <div className="flex gap-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => select(t.value)}
                className={cn(
                  "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors",
                  active ? "text-charcoal" : "text-stone hover:text-charcoal",
                )}
              >
                <Icon className="size-4" />
                {t.label}
                <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-stone">{t.count}</span>
                {active && (
                  <motion.span layoutId="homepage-tab" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold-gradient" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {tab === "banners" ? (
        <BannersPanel banners={banners} canEdit={canEdit} now={now} />
      ) : (
        <SectionsPanel
          sections={sections}
          categories={categories}
          promoBanners={banners.filter((b) => b.placement === "promo")}
          productMap={productMap}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
