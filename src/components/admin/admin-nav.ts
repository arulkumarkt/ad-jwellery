import {
  FolderTree,
  Gem,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  ShoppingBag,
  Star,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const ADMIN_NAV: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "Store performance at a glance" }],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Gem, description: "Pieces, pricing and inventory" },
      { href: "/admin/categories", label: "Categories", icon: FolderTree, description: "Collections and subcategories" },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, description: "Fulfilment and order history" },
      { href: "/admin/customers", label: "Customers", icon: Users, description: "Your clientele" },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, description: "Offers and promo codes" },
    ],
  },
  {
    group: "Storefront",
    items: [
      { href: "/admin/homepage", label: "Homepage", icon: PanelsTopLeft, description: "Banners and curated sections" },
      { href: "/admin/reviews", label: "Reviews", icon: Star, description: "Moderate customer reviews" },
      { href: "/admin/settings", label: "Settings", icon: Settings, description: "Store details and policies" },
    ],
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function activeNavItem(pathname: string): AdminNavItem | undefined {
  return ADMIN_NAV.flatMap((g) => g.items).find((i) => isNavActive(pathname, i.href));
}
