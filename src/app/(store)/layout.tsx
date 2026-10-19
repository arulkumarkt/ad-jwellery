import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { RouteProgress } from "@/components/motion";
import { StoreProvider } from "@/components/providers/store-provider";
import { QuickViewProvider } from "@/components/product/quick-view";
import { getCustomerSession } from "@/lib/auth";
import { getCategoryTree } from "@/services/category.service";
import { getSettings } from "@/services/settings.service";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, customer] = await Promise.all([getSettings(), getCategoryTree(), getCustomerSession()]);
  return (
    <StoreProvider initialCustomer={customer}>
      <QuickViewProvider>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-charcoal focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <AnnouncementBar messages={settings.announcements} />
      <Navbar categories={categories} logoText={settings.logoText} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
      <SearchOverlay />
      </QuickViewProvider>
    </StoreProvider>
  );
}
