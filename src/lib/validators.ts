import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => trimmed(max).optional().default("");
const indianPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"));
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");
const imageUrl = z
  .string()
  .trim()
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "Must be an absolute URL or a /path");

// ─── Auth ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: trimmed(80).min(2, "Please enter your name"),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  phone: indianPhone.optional().or(z.literal("")).default(""),
  password,
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password").max(128),
});

export const profileSchema = z.object({
  name: trimmed(80).min(2),
  phone: indianPhone.optional().or(z.literal("")).default(""),
  marketingOptIn: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  });

// ─── Addresses ────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: optionalText(30),
  fullName: trimmed(80).min(2, "Enter the recipient's name"),
  phone: indianPhone,
  line1: trimmed(160).min(4, "Enter house / street"),
  line2: optionalText(160),
  landmark: optionalText(120),
  city: trimmed(80).min(2, "Enter city"),
  state: trimmed(80).min(2, "Select state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  country: z.string().trim().default("India"),
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

// ─── Cart / wishlist ──────────────────────────────────────────────────

export const cartAddSchema = z.object({
  productId: objectId,
  variantId: objectId.nullable().optional().default(null),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: objectId,
  quantity: z.number().int().min(0).max(20),
});

export const couponApplySchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(32).nullable(),
});

export const wishlistSchema = z.object({ productId: objectId });

// ─── Checkout ─────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  contact: z.object({
    name: trimmed(80).min(2, "Enter your name"),
    email: z.email("Enter a valid email").trim().toLowerCase(),
    phone: indianPhone,
  }),
  shippingAddress: addressSchema.omit({ label: true, isDefault: true }),
  saveAddress: z.boolean().optional().default(false),
  paymentMethod: z.enum(["cod", "razorpay"]),
  notes: optionalText(500),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const paymentVerifySchema = z.object({
  orderId: objectId,
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

// ─── Reviews / newsletter ─────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: optionalText(120),
  comment: trimmed(2000).min(10, "Tell us a little more (10+ characters)"),
});

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  source: optionalText(30),
});

// ─── Admin: catalog ───────────────────────────────────────────────────

export const imageSchema = z.object({
  url: imageUrl,
  alt: optionalText(160),
  thumbnail: z.string().trim().optional().default(""),
  isMain: z.boolean().optional().default(false),
});

export const variantSchema = z.object({
  _id: objectId.optional(),
  name: trimmed(80).min(1, "Variant name required"),
  sku: trimmed(40).min(2, "SKU required").toUpperCase(),
  color: optionalText(40),
  size: optionalText(40),
  price: z.number().min(0),
  mrp: z.number().min(0),
  stock: z.number().int().min(0),
  images: z.array(imageSchema).max(12).optional().default([]),
});

export const productInputSchema = z
  .object({
    name: trimmed(160).min(2, "Product name required"),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and dashes only").optional().default(""),
    description: optionalText(8000),
    shortDescription: optionalText(300),
    category: objectId,
    subcategory: objectId.nullable().optional().default(null),
    images: z.array(imageSchema).max(15).default([]),
    price: z.number().min(0, "Price must be positive"),
    mrp: z.number().min(0),
    sku: trimmed(40).min(2, "SKU required").toUpperCase(),
    stock: z.number().int().min(0).default(0),
    material: optionalText(80),
    plating: optionalText(80),
    jewelleryType: optionalText(80),
    occasion: z.array(trimmed(40)).max(10).optional().default([]),
    color: optionalText(60),
    weight: optionalText(40),
    size: optionalText(60),
    careInstructions: optionalText(2000),
    variants: z.array(variantSchema).max(30).default([]),
    tags: z.array(trimmed(40)).max(30).default([]),
    isFeatured: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isTrending: z.boolean().default(false),
    isActive: z.boolean().default(true),
    seo: z
      .object({ title: optionalText(70), description: optionalText(170), ogImage: z.string().trim().optional().default("") })
      .optional()
      .default({ title: "", description: "", ogImage: "" }),
  })
  .refine((p) => p.mrp >= p.price, { message: "MRP must be greater than or equal to price", path: ["mrp"] })
  .refine((p) => p.variants.every((v) => v.mrp >= v.price), {
    message: "Each variant's MRP must be ≥ its price",
    path: ["variants"],
  });
export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: trimmed(80).min(2, "Category name required"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]*$/).optional().default(""),
  description: optionalText(600),
  image: z.string().trim().optional().default(""),
  bannerImage: z.string().trim().optional().default(""),
  parent: objectId.nullable().optional().default(null),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const reorderSchema = z.object({
  ids: z.array(objectId).min(1).max(500),
});

// ─── Admin: orders / coupons / customers ──────────────────────────────

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
  note: optionalText(300),
  trackingNumber: z.string().trim().max(80).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

export const couponInputSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "3–32 letters, numbers, - or _"),
    description: optionalText(200),
    type: z.enum(["percentage", "fixed"]),
    value: z.number().positive("Value must be greater than 0"),
    maxDiscount: z.number().min(0).default(0),
    minOrderAmount: z.number().min(0).default(0),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    usageLimit: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percentage" || c.value <= 90, { message: "Percentage must be ≤ 90", path: ["value"] })
  .refine((c) => !c.startsAt || !c.expiresAt || c.expiresAt > c.startsAt, {
    message: "Expiry must be after start",
    path: ["expiresAt"],
  });

export const customerAdminUpdateSchema = z.object({
  name: trimmed(80).min(2).optional(),
  phone: indianPhone.optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ─── Admin: storefront content ────────────────────────────────────────

const optionalHref = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Use a /path or full URL")
  .optional()
  .default("");

export const bannerInputSchema = z.object({
  placement: z.enum(["hero", "promo", "strip"]),
  eyebrow: optionalText(60),
  title: trimmed(120).min(2, "Title required"),
  subtitle: optionalText(300),
  image: imageUrl,
  mobileImage: z.string().trim().optional().default(""),
  ctaLabel: optionalText(40),
  ctaHref: optionalHref,
  secondaryCtaLabel: optionalText(40),
  secondaryCtaHref: optionalHref,
  theme: z.enum(["light", "dark"]).default("light"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const sectionItemSchema = z.object({
  title: optionalText(120),
  text: optionalText(600),
  icon: optionalText(40),
  image: z.string().trim().optional().default(""),
  href: optionalHref,
  author: optionalText(80),
  meta: optionalText(80),
  rating: z.number().min(0).max(5).optional().default(0),
});

export const homeSectionInputSchema = z.object({
  type: z.enum([
    "featured-categories",
    "best-sellers",
    "new-arrivals",
    "featured-products",
    "shop-by-type",
    "promo-banner",
    "why-choose-us",
    "testimonials",
    "social-gallery",
    "newsletter",
  ]),
  eyebrow: optionalText(60),
  title: optionalText(120),
  subtitle: optionalText(300),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
  limit: z.number().int().min(1).max(24).default(8),
  productIds: z.array(objectId).max(24).optional().default([]),
  categoryIds: z.array(objectId).max(24).optional().default([]),
  bannerId: objectId.nullable().optional().default(null),
  items: z.array(sectionItemSchema).max(24).optional().default([]),
});

export const settingsInputSchema = z.object({
  storeName: trimmed(60).min(2),
  tagline: optionalText(120),
  logoText: optionalText(30),
  announcements: z.array(trimmed(140)).max(6).default([]),
  contact: z.object({
    email: z.string().trim().max(120).default(""),
    phone: z.string().trim().max(30).default(""),
    whatsapp: z.string().trim().max(30).default(""),
    address: z.string().trim().max(300).default(""),
    hours: z.string().trim().max(120).default(""),
  }),
  social: z.object({
    instagram: z.string().trim().max(200).default(""),
    facebook: z.string().trim().max(200).default(""),
    youtube: z.string().trim().max(200).default(""),
    pinterest: z.string().trim().max(200).default(""),
  }),
  shipping: z.object({
    freeShippingThreshold: z.number().min(0),
    flatRate: z.number().min(0),
    codFee: z.number().min(0),
    codEnabled: z.boolean(),
    estimatedDelivery: z.string().trim().max(60),
  }),
  policies: z.object({
    shipping: z.string().max(4000).default(""),
    returns: z.string().max(4000).default(""),
    care: z.string().max(4000).default(""),
  }),
  seo: z.object({
    defaultTitle: z.string().trim().max(70).default(""),
    defaultDescription: z.string().trim().max(170).default(""),
    ogImage: z.string().trim().max(400).default(""),
  }),
});

// ─── Query parsing ────────────────────────────────────────────────────

const numberish = z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().finite().optional());

export const productQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(96).optional(),
  subcategory: z.string().trim().max(96).optional(),
  minPrice: numberish,
  maxPrice: numberish,
  inStock: z.preprocess((v) => v === "1" || v === "true" || v === true, z.boolean()).optional(),
  badge: z.enum(["new", "bestseller", "trending", "sale", "featured"]).optional().catch(undefined),
  plating: z.string().trim().max(60).optional(),
  sort: z
    .enum(["featured", "newest", "price-asc", "price-desc", "best-selling", "rating"])
    .optional()
    .catch(undefined),
  page: z.preprocess((v) => (v ? Number(v) : 1), z.number().int().min(1).max(500)).catch(1),
  pageSize: z.preprocess((v) => (v ? Number(v) : 12), z.number().int().min(1).max(48)).catch(12),
});
