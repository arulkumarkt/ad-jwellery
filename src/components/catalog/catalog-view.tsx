import { SearchX } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import { ProductGrid } from "@/components/product/product-grid";
import { getFacets, listProducts } from "@/services/product.service";
import type { CategoryDTO, ProductFilters } from "@/types";
import { ActiveFilterChips, CatalogResults, FilterPanel, MobileFilters, SortSelect } from "./catalog-client";
import { CatalogProvider } from "./use-catalog-params";

const FILTER_KEYS = ["category", "subcategory", "minPrice", "maxPrice", "inStock", "badge", "plating"] as const;

export async function CatalogView({
  filters,
  categories,
  baseCategory,
  basePath,
  rawParams,
}: {
  filters: ProductFilters;
  categories: CategoryDTO[];
  baseCategory?: CategoryDTO | null;
  basePath: string;
  rawParams: Record<string, string | undefined>;
}) {
  const [result, facets] = await Promise.all([listProducts(filters), getFacets(filters.category)]);
  const activeCount = FILTER_KEYS.filter((k) => rawParams[k]).length;
  const hrefFor = (page: number) => {
    const qs = new URLSearchParams(Object.entries(rawParams).filter((e): e is [string, string] => Boolean(e[1])));
    if (page > 1) qs.set("page", String(page));
    else qs.delete("page");
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const panelProps = { categories, facets, activeCategory: filters.category, baseCategory, showCategories: basePath === "/products" };
  const from = (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.total, result.page * result.pageSize);

  return (
    <CatalogProvider>
      <div className="container-lux grid gap-10 pb-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 no-scrollbar">
            <FilterPanel {...panelProps} />
          </div>
        </aside>
        <div className="min-w-0">
          <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-ivory/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0 lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <p className="text-sm text-stone">
              {result.total > 0 ? (
                <>
                  Showing <span className="font-medium text-charcoal">{from}–{to}</span> of {result.total}
                </>
              ) : (
                "No products"
              )}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters {...panelProps} activeCount={activeCount} total={result.total} />
              <SortSelect />
            </div>
          </div>
          <div className="mb-6">
            <ActiveFilterChips categories={categories} />
          </div>
          <CatalogResults>
            {result.items.length ? (
              <>
                <ProductGrid products={result.items} columns={3} />
                <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} className="mt-14" />
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title={filters.q ? `Nothing found for “${filters.q}”` : "No pieces match these filters"}
                description="Try removing a filter or searching for something else — new designs arrive every week."
                action={{ label: "Browse all jewellery", href: "/products" }}
              />
            )}
          </CatalogResults>
        </div>
      </div>
    </CatalogProvider>
  );
}
