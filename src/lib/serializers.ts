import "server-only";
import type { Types } from "mongoose";
import type {
  AddressDTO,
  BannerDTO,
  CategoryDTO,
  CategoryRefDTO,
  CouponDTO,
  CustomerDTO,
  HomeSectionDTO,
  ImageDTO,
  OrderDTO,
  ProductCardDTO,
  ProductDTO,
  ReviewDTO,
  SiteSettingsDTO,
  VariantDTO,
} from "@/types";
import type {
  AddressDoc,
  BannerDoc,
  CategoryDoc,
  CouponDoc,
  CustomerDoc,
  HomeSectionDoc,
  OrderDoc,
  ProductDoc,
  ReviewDoc,
  SettingDoc,
} from "@/models";

type Lean<T> = T & { _id: Types.ObjectId };
type MaybeRef = Types.ObjectId | { _id: Types.ObjectId; name?: string; slug?: string } | null | undefined;

const str = (v: unknown): string => (v == null ? "" : String(v));
const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : v ? new Date(String(v)).toISOString() : "");
const isoOrNull = (v: unknown): string | null => (v ? iso(v) : null);
export const idOf = (v: unknown): string | null => {
  if (!v) return null;
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as { _id: unknown })._id);
  return String(v);
};

function toImage(img: { url?: string | null; alt?: string | null; thumbnail?: string | null; isMain?: boolean | null }): ImageDTO {
  return { url: str(img.url), alt: str(img.alt), thumbnail: str(img.thumbnail) || str(img.url), isMain: Boolean(img.isMain) };
}

function toCategoryRef(v: MaybeRef): CategoryRefDTO | null {
  if (!v || typeof v !== "object" || !("name" in v) || !v.name) return null;
  return { _id: String(v._id), name: str(v.name), slug: str(v.slug) };
}

export function serializeCategory(c: Lean<CategoryDoc>): CategoryDTO {
  return {
    _id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: str(c.description),
    image: str(c.image),
    bannerImage: str(c.bannerImage),
    parent: idOf(c.parent),
    order: c.order ?? 0,
    isActive: c.isActive ?? true,
    isFeatured: c.isFeatured ?? false,
    seoTitle: str(c.seoTitle),
    seoDescription: str(c.seoDescription),
  };
}

export function serializeProductCard(p: Lean<ProductDoc>): ProductCardDTO {
  const images = (p.images ?? []).map(toImage);
  const main = images.find((i) => i.isMain) ?? images[0] ?? null;
  const hover = images.find((i) => i !== main) ?? null;
  const variants = p.variants ?? [];
  const firstInStock = variants.find((v) => (v.stock ?? 0) > 0) ?? variants[0];
  return {
    _id: String(p._id),
    name: p.name,
    slug: p.slug,
    price: p.price,
    mrp: p.mrp,
    discountPercentage: p.discountPercentage ?? 0,
    image: main,
    hoverImage: hover,
    category: toCategoryRef(p.category as MaybeRef),
    ratings: Math.round((p.ratings ?? 0) * 10) / 10,
    reviewCount: p.reviewCount ?? 0,
    stock: p.stock ?? 0,
    hasVariants: variants.length > 0,
    defaultVariantId: firstInStock ? String((firstInStock as { _id: Types.ObjectId })._id) : null,
    plating: str(p.plating),
    isFeatured: Boolean(p.isFeatured),
    isBestSeller: Boolean(p.isBestSeller),
    isNewArrival: Boolean(p.isNewArrival),
    isTrending: Boolean(p.isTrending),
  };
}

export function serializeProduct(p: Lean<ProductDoc>): ProductDTO {
  const variants: VariantDTO[] = (p.variants ?? []).map((v) => ({
    _id: String((v as { _id: Types.ObjectId })._id),
    name: v.name,
    sku: v.sku,
    color: str(v.color),
    size: str(v.size),
    price: v.price,
    mrp: v.mrp,
    stock: v.stock ?? 0,
    images: (v.images ?? []).map(toImage),
  }));
  return {
    ...serializeProductCard(p),
    description: str(p.description),
    shortDescription: str(p.shortDescription),
    subcategory: toCategoryRef(p.subcategory as MaybeRef),
    images: (p.images ?? []).map(toImage),
    sku: p.sku,
    material: str(p.material),
    jewelleryType: str(p.jewelleryType),
    occasion: (p.occasion ?? []).map(String),
    color: str(p.color),
    weight: str(p.weight),
    size: str(p.size),
    careInstructions: str(p.careInstructions),
    variants,
    tags: (p.tags ?? []).map(String),
    isActive: p.isActive ?? true,
    salesCount: p.salesCount ?? 0,
    seo: { title: str(p.seo?.title), description: str(p.seo?.description), ogImage: str(p.seo?.ogImage) },
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

export function serializeAddress(a: Lean<AddressDoc>): AddressDTO {
  return {
    _id: String(a._id),
    label: str(a.label),
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: str(a.line2),
    landmark: str(a.landmark),
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: str(a.country) || "India",
    isDefault: Boolean(a.isDefault),
  };
}

export function serializeOrder(o: Lean<OrderDoc>): OrderDTO {
  const sa = o.shippingAddress;
  const contact = o.contact ?? { name: "", email: "", phone: "" };
  const payment = o.payment ?? { method: "cod", status: "pending", providerOrderId: null, providerPaymentId: null, paidAt: null };
  return {
    _id: String(o._id),
    orderNumber: o.orderNumber,
    customer: idOf(o.customer),
    contact: { name: contact.name, email: contact.email, phone: contact.phone },
    items: (o.items ?? []).map((i) => ({
      _id: String((i as { _id: Types.ObjectId })._id),
      product: String(i.product),
      variantId: idOf(i.variantId),
      name: i.name,
      slug: i.slug,
      image: str(i.image),
      sku: i.sku,
      variantLabel: str(i.variantLabel),
      price: i.price,
      mrp: i.mrp,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    shippingAddress: {
      fullName: sa.fullName,
      phone: sa.phone,
      line1: sa.line1,
      line2: str(sa.line2),
      landmark: str(sa.landmark),
      city: sa.city,
      state: sa.state,
      pincode: sa.pincode,
      country: str(sa.country) || "India",
    },
    subtotal: o.subtotal,
    discount: o.discount ?? 0,
    shippingFee: o.shippingFee ?? 0,
    codFee: o.codFee ?? 0,
    total: o.total,
    coupon: { code: o.coupon?.code ?? null, discount: o.coupon?.discount ?? 0 },
    payment: {
      method: payment.method as OrderDTO["payment"]["method"],
      status: (payment.status ?? "pending") as OrderDTO["payment"]["status"],
      providerOrderId: payment.providerOrderId ?? null,
      providerPaymentId: payment.providerPaymentId ?? null,
      paidAt: isoOrNull(payment.paidAt),
    },
    status: (o.status ?? "pending") as OrderDTO["status"],
    statusHistory: (o.statusHistory ?? []).map((h) => ({
      status: h.status as OrderDTO["status"],
      note: str(h.note),
      at: iso(h.at),
    })),
    notes: str(o.notes),
    trackingNumber: str(o.trackingNumber),
    createdAt: iso(o.createdAt),
    updatedAt: iso(o.updatedAt),
  };
}

export function serializeCustomer(c: Lean<CustomerDoc>): CustomerDTO {
  return {
    _id: String(c._id),
    name: c.name,
    email: c.email,
    phone: str(c.phone),
    isActive: c.isActive ?? true,
    marketingOptIn: Boolean(c.marketingOptIn),
    lastLoginAt: isoOrNull(c.lastLoginAt),
    createdAt: iso(c.createdAt),
  };
}

export function serializeReview(r: Lean<ReviewDoc>): ReviewDTO {
  return {
    _id: String(r._id),
    product: String(r.product),
    name: r.name,
    location: str(r.location),
    rating: r.rating,
    title: str(r.title),
    comment: r.comment,
    isApproved: r.isApproved ?? true,
    isVerifiedPurchase: Boolean(r.isVerifiedPurchase),
    createdAt: iso(r.createdAt),
  };
}

export function serializeCoupon(c: Lean<CouponDoc>): CouponDTO {
  return {
    _id: String(c._id),
    code: c.code,
    description: str(c.description),
    type: c.type as CouponDTO["type"],
    value: c.value,
    maxDiscount: c.maxDiscount ?? 0,
    minOrderAmount: c.minOrderAmount ?? 0,
    startsAt: isoOrNull(c.startsAt),
    expiresAt: isoOrNull(c.expiresAt),
    usageLimit: c.usageLimit ?? 0,
    usedCount: c.usedCount ?? 0,
    isActive: c.isActive ?? true,
    createdAt: iso(c.createdAt),
  };
}

export function serializeBanner(b: Lean<BannerDoc>): BannerDTO {
  return {
    _id: String(b._id),
    placement: (b.placement ?? "hero") as BannerDTO["placement"],
    eyebrow: str(b.eyebrow),
    title: b.title,
    subtitle: str(b.subtitle),
    image: b.image,
    mobileImage: str(b.mobileImage),
    ctaLabel: str(b.ctaLabel),
    ctaHref: str(b.ctaHref),
    secondaryCtaLabel: str(b.secondaryCtaLabel),
    secondaryCtaHref: str(b.secondaryCtaHref),
    theme: (b.theme ?? "light") as BannerDTO["theme"],
    order: b.order ?? 0,
    isActive: b.isActive ?? true,
    startsAt: isoOrNull(b.startsAt),
    endsAt: isoOrNull(b.endsAt),
  };
}

export function serializeHomeSection(s: Lean<HomeSectionDoc>): HomeSectionDTO {
  return {
    _id: String(s._id),
    type: s.type as HomeSectionDTO["type"],
    eyebrow: str(s.eyebrow),
    title: str(s.title),
    subtitle: str(s.subtitle),
    order: s.order ?? 0,
    isActive: s.isActive ?? true,
    limit: s.limit ?? 8,
    productIds: (s.products ?? []).map((p) => idOf(p) ?? "").filter(Boolean),
    categoryIds: (s.categories ?? []).map((c) => idOf(c) ?? "").filter(Boolean),
    bannerId: idOf(s.banner),
    items: (s.items ?? []).map((i) => ({
      title: str(i.title),
      text: str(i.text),
      icon: str(i.icon),
      image: str(i.image),
      href: str(i.href),
      author: str(i.author),
      meta: str(i.meta),
      rating: i.rating ?? 0,
    })),
  };
}

export function serializeSettings(s: Partial<SettingDoc> | null): SiteSettingsDTO {
  return {
    storeName: str(s?.storeName) || "Swarnika",
    tagline: str(s?.tagline),
    logoText: str(s?.logoText) || "SWARNIKA",
    announcements: (s?.announcements ?? []).map(String),
    contact: {
      email: str(s?.contact?.email),
      phone: str(s?.contact?.phone),
      whatsapp: str(s?.contact?.whatsapp),
      address: str(s?.contact?.address),
      hours: str(s?.contact?.hours),
    },
    social: {
      instagram: str(s?.social?.instagram),
      facebook: str(s?.social?.facebook),
      youtube: str(s?.social?.youtube),
      pinterest: str(s?.social?.pinterest),
    },
    shipping: {
      freeShippingThreshold: s?.shipping?.freeShippingThreshold ?? 999,
      flatRate: s?.shipping?.flatRate ?? 79,
      codFee: s?.shipping?.codFee ?? 49,
      codEnabled: s?.shipping?.codEnabled ?? true,
      estimatedDelivery: str(s?.shipping?.estimatedDelivery) || "3–7 business days",
    },
    policies: {
      shipping: str(s?.policies?.shipping),
      returns: str(s?.policies?.returns),
      care: str(s?.policies?.care),
    },
    seo: {
      defaultTitle: str(s?.seo?.defaultTitle),
      defaultDescription: str(s?.seo?.defaultDescription),
      ogImage: str(s?.seo?.ogImage),
    },
  };
}
