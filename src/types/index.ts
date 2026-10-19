/**
 * Serialised (JSON-safe) shapes shared by API routes, server components and
 * client components. Database documents are mapped into these before they
 * leave the server so ObjectIds/Dates never leak into the client bundle.
 */

export type ID = string;

export interface ImageDTO {
  url: string;
  alt: string;
  thumbnail: string;
  isMain: boolean;
}

export interface VariantDTO {
  _id: ID;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  images: ImageDTO[];
}

export interface CategoryRefDTO {
  _id: ID;
  name: string;
  slug: string;
}

export interface CategoryDTO extends CategoryRefDTO {
  description: string;
  image: string;
  bannerImage: string;
  parent: ID | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  productCount?: number;
  children?: CategoryDTO[];
}

export interface ProductBadges {
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
}

/** Lightweight shape for grids, carousels, wishlist and search previews. */
export interface ProductCardDTO extends ProductBadges {
  _id: ID;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discountPercentage: number;
  image: ImageDTO | null;
  hoverImage: ImageDTO | null;
  category: CategoryRefDTO | null;
  ratings: number;
  reviewCount: number;
  stock: number;
  hasVariants: boolean;
  defaultVariantId: ID | null;
  plating: string;
}

export interface ProductDTO extends ProductCardDTO {
  description: string;
  shortDescription: string;
  subcategory: CategoryRefDTO | null;
  images: ImageDTO[];
  sku: string;
  material: string;
  jewelleryType: string;
  occasion: string[];
  color: string;
  weight: string;
  size: string;
  careInstructions: string;
  variants: VariantDTO[];
  tags: string[];
  isActive: boolean;
  salesCount: number;
  seo: { title: string; description: string; ogImage: string };
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "best-selling" | "rating";

export interface ProductFilters {
  q?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  badge?: "new" | "bestseller" | "trending" | "sale" | "featured";
  plating?: string;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface FacetsDTO {
  priceRange: { min: number; max: number };
  platings: string[];
}

export interface CartLineDTO {
  _id: ID;
  productId: ID;
  variantId: ID | null;
  name: string;
  slug: string;
  image: string;
  variantLabel: string;
  sku: string;
  price: number;
  mrp: number;
  quantity: number;
  stock: number;
  available: boolean;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  mrpTotal: number;
  savings: number;
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
}

export interface CartDTO extends CartTotals {
  items: CartLineDTO[];
  itemCount: number;
  couponCode: string | null;
  couponDescription: string | null;
  couponError: string | null;
  freeShippingThreshold: number;
}

export interface WishlistDTO {
  productIds: ID[];
  products: ProductCardDTO[];
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
export type PaymentMethod = "cod" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface AddressDTO {
  _id: ID;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItemDTO {
  _id: ID;
  product: ID;
  variantId: ID | null;
  name: string;
  slug: string;
  image: string;
  sku: string;
  variantLabel: string;
  price: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDTO {
  _id: ID;
  orderNumber: string;
  customer: ID | null;
  contact: { name: string; email: string; phone: string };
  items: OrderItemDTO[];
  shippingAddress: Omit<AddressDTO, "_id" | "label" | "isDefault">;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  coupon: { code: string | null; discount: number };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    providerOrderId: string | null;
    providerPaymentId: string | null;
    paidAt: string | null;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; note: string; at: string }[];
  notes: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDTO {
  _id: ID;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  marketingOptIn: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
}

export interface ReviewDTO {
  _id: ID;
  product: ID;
  name: string;
  location: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewSummaryDTO {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CouponDTO {
  _id: ID;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount: number;
  minOrderAmount: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export type BannerPlacement = "hero" | "promo" | "strip";

export interface BannerDTO {
  _id: ID;
  placement: BannerPlacement;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  mobileImage: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  theme: "light" | "dark";
  order: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export type HomeSectionType =
  | "featured-categories"
  | "best-sellers"
  | "new-arrivals"
  | "featured-products"
  | "shop-by-type"
  | "promo-banner"
  | "why-choose-us"
  | "testimonials"
  | "social-gallery"
  | "newsletter";

export interface SectionItemDTO {
  title: string;
  text: string;
  icon: string;
  image: string;
  href: string;
  author: string;
  meta: string;
  rating: number;
}

export interface HomeSectionDTO {
  _id: ID;
  type: HomeSectionType;
  eyebrow: string;
  title: string;
  subtitle: string;
  order: number;
  isActive: boolean;
  limit: number;
  productIds: ID[];
  categoryIds: ID[];
  bannerId: ID | null;
  items: SectionItemDTO[];
}

/** A home section with its referenced data resolved, ready to render. */
export interface ResolvedHomeSection extends HomeSectionDTO {
  products: ProductCardDTO[];
  categories: CategoryDTO[];
  banner: BannerDTO | null;
}

export interface SiteSettingsDTO {
  storeName: string;
  tagline: string;
  logoText: string;
  announcements: string[];
  contact: { email: string; phone: string; whatsapp: string; address: string; hours: string };
  social: { instagram: string; facebook: string; youtube: string; pinterest: string };
  shipping: {
    freeShippingThreshold: number;
    flatRate: number;
    codFee: number;
    codEnabled: boolean;
    estimatedDelivery: string;
  };
  policies: { shipping: string; returns: string; care: string };
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string };
}

export interface SessionCustomer {
  id: ID;
  name: string;
  email: string;
}

export type AdminRole = "owner" | "manager" | "staff";

export interface SessionAdmin {
  id: ID;
  name: string;
  email: string;
  role: AdminRole;
}

export interface SearchSuggestionsDTO {
  products: ProductCardDTO[];
  categories: CategoryRefDTO[];
  total: number;
}

export interface DashboardStatsDTO {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: OrderDTO[];
  bestSellers: { _id: ID; name: string; slug: string; image: string; sold: number; revenue: number }[];
  salesByDay: { date: string; sales: number; orders: number }[];
  statusBreakdown: { status: OrderStatus; count: number }[];
}

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { message: string; fields?: Record<string, string> } };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
