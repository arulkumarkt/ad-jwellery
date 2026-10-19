/**
 * Seeds MongoDB with a realistic covering-jewellery catalogue, homepage
 * content, coupons, an admin user and demo customer activity.
 *
 *   npm run seed            # wipe catalogue/content collections and reseed
 *
 * Reads MONGODB_URI, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from .env.local / .env.
 */
import { config } from "dotenv";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import {
  Address,
  AdminUser,
  Banner,
  Cart,
  Category,
  Counter,
  Coupon,
  Customer,
  HomeSection,
  Order,
  Product,
  Review,
  Setting,
  Subscriber,
  Wishlist,
} from "../src/models";

config({ path: ".env.local" });
config();

const img = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
const thumb = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&h=750&q=75&auto=format&fit=crop`;
const photo = (id: string, alt: string, isMain = false) => ({ url: img(id), thumbnail: thumb(id), alt, isMain });

const P = {
  indianSet: "1601121141461-9d6647bca1ed",
  temple: "1601121141418-c1caa10a2a0b",
  bride: "1617627143750-d86bc21e42bb",
  saree: "1610030469983-98e550d6193c",
  pearl: "1515562141207-7a88fb7ce338",
  blueEarrings: "1535632066927-ab7c9ab60908",
  crystalBracelet: "1573408301185-9146fe634ad0",
  bangleWrist: "1583292650898-7d22cd27ca6f",
  heartPendant: "1588444837495-c6cfeb53f32d",
  layeredRose: "1590548784585-643d2b9f2925",
  wristBracelet: "1596944924616-7b38e7cfac36",
  squarePendant: "1598560917505-59a3ad559071",
  chainPendant: "1599643478518-a784e5dc4c8f",
  modelNecklace: "1600721391689-2564bb8055de",
  chainBracelet: "1602173574767-37ac01994b2a",
  flowerGem: "1602751584552-8ba73aad10e1",
  pinkRing: "1603561591411-07134e71a2a9",
  haloRing: "1605100804763-247f67b3557e",
  blueRing: "1606623546924-a4f3ae5ea3e8",
  flatlay: "1606760227091-3dd870d97f1d",
  stoneRings: "1608042314453-ae338d80c427",
  fineNecklace: "1610694955371-d4a3e0ce4b52",
  fineNecklace2: "1611085583191-a3b181a88401",
  goldBangles: "1611107683227-e9060eccd846",
  roseBracelet: "1611591437281-460bfbe1220a",
  modelNecklace2: "1611652022419-a9419f74343d",
  hoops: "1617038220319-276d3cfab638",
  hoops2: "1617038260897-41a1f14a8ca0",
  modelRing: "1620656798579-1984d9e87df7",
  goldRings: "1622398925373-3f91b1e275f5",
  goldStuds: "1626784215021-2e39ccf971cd",
  roseDrops: "1629224316810-9d8805b95e76",
  blueHearts: "1630019852942-f89202989a59",
  pendants: "1631965004544-1762fc696476",
  chainModel: "1633810542706-90e5ff7557be",
  layeredChains: "1635767798638-3e25273a8236",
  ringsBox: "1584302179602-e4c3d3fd629d",
  diamondStuds: "1588444650733-d0767b753fc8",
  earringModel: "1590166223826-12dee1677420",
  layeredModel: "1601821765780-754fa98637c1",
  emeraldRing: "1602752250015-52934bc45613",
  hoopsPink: "1608508644127-ba99d7732fee",
  champagneRing: "1611955167811-4711904bb9f8",
  tennisBracelet: "1619119069152-a2b331eb392a",
  solitaire: "1598560917807-1bae44bd2be8",
} as const;

const CARE = [
  "Store in the zip pouch provided, away from moisture and air.",
  "Keep away from perfume, deodorant, hairspray and water.",
  "Wipe gently with a soft dry cloth after every wear.",
  "Put your jewellery on last and take it off first.",
].join("\n");

type CatSeed = {
  name: string;
  description: string;
  image: string;
  featured?: boolean;
  children?: { name: string; description: string; image: string }[];
};

const CATEGORIES: CatSeed[] = [
  {
    name: "Necklaces",
    description: "Statement harams, chokers and necklace sets in micro-gold plating.",
    image: P.indianSet,
    featured: true,
    children: [
      { name: "Chokers", description: "Close-fitting chokers for sarees and lehengas.", image: P.temple },
      { name: "Harams", description: "Long temple and Lakshmi harams.", image: P.indianSet },
      { name: "Necklace Sets", description: "Necklaces with matching earrings.", image: P.modelNecklace2 },
    ],
  },
  {
    name: "Earrings",
    description: "Jhumkas, studs and drops that move with you.",
    image: P.goldStuds,
    featured: true,
    children: [
      { name: "Jhumkas", description: "Classic bell jhumkas, from petite to grand.", image: P.goldStuds },
      { name: "Studs", description: "Everyday studs and kundan tops.", image: P.diamondStuds },
      { name: "Drops & Danglers", description: "Lightweight drops for evenings out.", image: P.roseDrops },
    ],
  },
  {
    name: "Bangles",
    description: "Kadas and bangle sets in every size.",
    image: P.goldBangles,
    featured: true,
    children: [
      { name: "Bangle Sets", description: "Sets of 2, 4 and 6 bangles.", image: P.goldBangles },
      { name: "Kadas", description: "Broad single kadas with stone work.", image: P.bangleWrist },
    ],
  },
  { name: "Bracelets", description: "Chain, cuff and tennis bracelets.", image: P.chainBracelet, featured: true },
  { name: "Rings", description: "Cocktail, adjustable and stackable rings.", image: P.goldRings, featured: true },
  { name: "Chains", description: "Gold-plated chains for daily wear.", image: P.layeredChains, featured: true },
  {
    name: "Pendants",
    description: "Pendants and pendant sets with fine chains.",
    image: P.pendants,
    featured: true,
    children: [{ name: "Pendant Sets", description: "Pendant with matching earrings.", image: P.squarePendant }],
  },
  { name: "Bridal Jewellery", description: "Complete bridal sets for the big day.", image: P.bride, featured: true },
  { name: "Combo Sets", description: "Curated combos at special prices.", image: P.flatlay },
  { name: "Daily Wear", description: "Light, comfortable pieces you can wear all day.", image: P.fineNecklace },
  { name: "Party Wear", description: "Sparkle for sangeets, receptions and parties.", image: P.crystalBracelet },
];

type VariantSeed = { name: string; sku: string; color?: string; size?: string; price: number; mrp: number; stock: number; images?: ReturnType<typeof photo>[] };

type ProductSeed = {
  name: string;
  category: string;
  subcategory?: string;
  short: string;
  description: string;
  price: number;
  mrp: number;
  sku: string;
  stock: number;
  images: ReturnType<typeof photo>[];
  material: string;
  plating: string;
  jewelleryType: string;
  color: string;
  weight: string;
  size: string;
  occasion: string[];
  tags: string[];
  variants?: VariantSeed[];
  flags?: Partial<Record<"isFeatured" | "isBestSeller" | "isNewArrival" | "isTrending", boolean>>;
  daysAgo?: number;
};

const PRODUCTS: ProductSeed[] = [
  {
    name: "Lakshmi Temple Gold-Plated Haram",
    category: "Necklaces",
    subcategory: "Harams",
    short: "A 24-inch temple haram with Goddess Lakshmi motifs, ruby-red kemp stones and pearl drops.",
    description:
      "Inspired by South Indian temple architecture, this long haram features hand-finished Lakshmi coin motifs, kemp stones and a cascade of faux pearls. Crafted on a brass base with micro-gold plating for a rich, antique-gold glow that photographs beautifully at weddings and poojas.",
    price: 2499,
    mrp: 3999,
    sku: "SW-NK-HRM-001",
    stock: 18,
    images: [photo(P.indianSet, "Lakshmi temple haram with matching earrings", true), photo(P.temple, "Temple haram pendant close-up"), photo(P.saree, "Model wearing temple haram with silk saree")],
    material: "Brass alloy",
    plating: "Micro gold plating",
    jewelleryType: "Haram",
    color: "Antique Gold",
    weight: "96 g",
    size: "24 inch length with adjustable dori",
    occasion: ["Wedding", "Festive"],
    tags: ["temple", "lakshmi", "haram", "kemp", "south indian"],
    flags: { isFeatured: true, isBestSeller: true, isTrending: true },
    daysAgo: 60,
  },
  {
    name: "Kemp Stone Antique Choker Set",
    category: "Necklaces",
    subcategory: "Chokers",
    short: "Broad antique choker with kemp stones and matching jhumka earrings.",
    description:
      "A regal choker set with deep-red kemp stones framed in antique-finish gold plating. Comes with matching jhumkas and an adjustable back dori for a comfortable fit on every neckline.",
    price: 1899,
    mrp: 2999,
    sku: "SW-NK-CHK-002",
    stock: 22,
    images: [photo(P.temple, "Antique kemp choker set", true), photo(P.indianSet, "Choker with earrings on display")],
    material: "Brass alloy",
    plating: "Antique gold plating",
    jewelleryType: "Choker",
    color: "Antique Gold / Red",
    weight: "74 g",
    size: "Adjustable dori",
    occasion: ["Wedding", "Festive"],
    tags: ["choker", "kemp", "antique", "set"],
    flags: { isBestSeller: true, isFeatured: true },
    daysAgo: 45,
  },
  {
    name: "Pearl Drop Gold-Plated Necklace Set",
    category: "Necklaces",
    subcategory: "Necklace Sets",
    short: "A delicate pearl strand set with a CZ clasp and matching drop earrings.",
    description:
      "Soft lustre faux pearls strung on a fine gold-plated chain with a sparkling cubic-zirconia clasp. Light enough for daily office wear, elegant enough for receptions.",
    price: 1299,
    mrp: 1999,
    sku: "SW-NK-SET-003",
    stock: 30,
    images: [photo(P.pearl, "Pearl necklace set in gift box", true), photo(P.modelNecklace, "Model wearing pearl necklace")],
    material: "Brass alloy, faux pearls",
    plating: "18K gold plating",
    jewelleryType: "Necklace Set",
    color: "Ivory / Gold",
    weight: "38 g",
    size: "16 inch + 2 inch extender",
    occasion: ["Party", "Office"],
    tags: ["pearl", "necklace set", "cz"],
    flags: { isNewArrival: true, isTrending: true },
    daysAgo: 6,
  },
  {
    name: "Rose Gold Layered Leaf Necklace",
    category: "Necklaces",
    subcategory: "Necklace Sets",
    short: "Two-layer rose-gold necklace with a leaf vine and pearl accent.",
    description:
      "A modern double-layer necklace pairing a leaf-vine chain with a dainty pearl drop. Hypoallergenic, nickel-free and finished with anti-tarnish lacquer.",
    price: 899,
    mrp: 1499,
    sku: "SW-NK-LYR-004",
    stock: 40,
    images: [photo(P.layeredRose, "Rose gold layered necklace", true), photo(P.layeredModel, "Layered necklaces styled")],
    material: "Stainless steel core",
    plating: "Rose gold plating",
    jewelleryType: "Layered Necklace",
    color: "Rose Gold",
    weight: "14 g",
    size: "16 & 18 inch layers",
    occasion: ["Daily", "Office"],
    tags: ["layered", "rose gold", "leaf", "minimal"],
    flags: { isNewArrival: true },
    daysAgo: 3,
  },
  {
    name: "Classic Gold-Plated Jhumka",
    category: "Earrings",
    subcategory: "Jhumkas",
    short: "Bell jhumkas with granulation work and tiny pearl hangings.",
    description:
      "The jhumka every wardrobe needs. Traditional granulation (ravai) detailing, a domed bell and a fringe of seed pearls — finished in micro-gold plating that resists fading.",
    price: 649,
    mrp: 999,
    sku: "SW-ER-JHM-005",
    stock: 0,
    images: [photo(P.goldStuds, "Gold-plated jhumka earrings", true), photo(P.earringModel, "Jhumka worn by model")],
    material: "Brass alloy",
    plating: "Micro gold plating",
    jewelleryType: "Jhumka",
    color: "Gold",
    weight: "22 g (pair)",
    size: "4.5 cm drop",
    occasion: ["Festive", "Daily"],
    tags: ["jhumka", "jhumki", "earrings", "traditional"],
    variants: [
      { name: "Small", sku: "SW-ER-JHM-005-S", size: "Small · 3.5 cm", price: 549, mrp: 899, stock: 25 },
      { name: "Medium", sku: "SW-ER-JHM-005-M", size: "Medium · 4.5 cm", price: 649, mrp: 999, stock: 34 },
      { name: "Large", sku: "SW-ER-JHM-005-L", size: "Large · 6 cm", price: 799, mrp: 1299, stock: 12 },
    ],
    flags: { isBestSeller: true, isTrending: true, isFeatured: true },
    daysAgo: 90,
  },
  {
    name: "Ruby Kundan Chandbali Earrings",
    category: "Earrings",
    subcategory: "Drops & Danglers",
    short: "Crescent chandbalis with ruby kundan and pearl fringe.",
    description:
      "Moon-shaped chandbalis set with ruby-tone kundan stones and a cascading pearl fringe. A lightweight hook design keeps them comfortable through long celebrations.",
    price: 1149,
    mrp: 1799,
    sku: "SW-ER-CHB-006",
    stock: 26,
    images: [photo(P.roseDrops, "Kundan chandbali earrings", true), photo(P.earringModel, "Chandbali styled with hair down")],
    material: "Brass alloy, kundan",
    plating: "Gold plating",
    jewelleryType: "Chandbali",
    color: "Gold / Ruby",
    weight: "28 g (pair)",
    size: "6.5 cm drop",
    occasion: ["Wedding", "Party"],
    tags: ["chandbali", "kundan", "earrings"],
    flags: { isTrending: true },
    daysAgo: 20,
  },
  {
    name: "CZ Halo Stud Earrings",
    category: "Earrings",
    subcategory: "Studs",
    short: "Brilliant-cut CZ studs with a halo setting and secure screw backs.",
    description:
      "Sparkling AAA cubic zirconia set in a halo for extra brilliance. Rhodium base with gold-tone and silver-tone finishes — your new everyday essential.",
    price: 499,
    mrp: 799,
    sku: "SW-ER-STD-007",
    stock: 0,
    images: [photo(P.diamondStuds, "CZ halo studs", true)],
    material: "Brass alloy, AAA CZ",
    plating: "Rhodium plating",
    jewelleryType: "Studs",
    color: "Silver",
    weight: "4 g (pair)",
    size: "9 mm",
    occasion: ["Daily", "Office"],
    tags: ["studs", "cz", "diamond look"],
    variants: [
      { name: "Silver Tone", sku: "SW-ER-STD-007-SL", color: "Silver", price: 499, mrp: 799, stock: 45 },
      { name: "Gold Tone", sku: "SW-ER-STD-007-GL", color: "Gold", price: 549, mrp: 849, stock: 30, images: [photo(P.goldStuds, "Gold tone studs", true)] },
    ],
    flags: { isBestSeller: true },
    daysAgo: 120,
  },
  {
    name: "Sapphire Blue Crystal Drop Earrings",
    category: "Earrings",
    subcategory: "Drops & Danglers",
    short: "Heart-cut sapphire-blue crystals on gold-plated French hooks.",
    description: "A playful pop of colour: heart-cut crystals suspended from slim gold-plated hooks. Pairs beautifully with pastel outfits.",
    price: 449,
    mrp: 699,
    sku: "SW-ER-DRP-008",
    stock: 35,
    images: [photo(P.blueHearts, "Blue heart drop earrings", true)],
    material: "Brass alloy, crystal",
    plating: "Gold plating",
    jewelleryType: "Drops",
    color: "Sapphire Blue",
    weight: "6 g (pair)",
    size: "3 cm drop",
    occasion: ["Party", "Daily"],
    tags: ["drops", "crystal", "blue"],
    flags: { isNewArrival: true },
    daysAgo: 4,
  },
  {
    name: "Antique Gold Bangle Set of 4",
    category: "Bangles",
    subcategory: "Bangle Sets",
    short: "Four textured bangles with antique finish and tiny ruby stones.",
    description:
      "A stack of four bangles with alternating textured and stone-studded designs. Antique gold plating with a matte finish gives an heirloom look without the heirloom price.",
    price: 0,
    mrp: 0,
    sku: "SW-BG-SET-009",
    stock: 0,
    images: [photo(P.goldBangles, "Stack of gold-plated bangles", true), photo(P.bangleWrist, "Bangles worn on wrist")],
    material: "Brass alloy",
    plating: "Antique gold plating",
    jewelleryType: "Bangle Set",
    color: "Antique Gold",
    weight: "64 g (set)",
    size: "2.4 / 2.6 / 2.8",
    occasion: ["Festive", "Wedding"],
    tags: ["bangles", "set of 4", "antique"],
    variants: [
      { name: "2.4", sku: "SW-BG-SET-009-24", size: "2.4", price: 1199, mrp: 1899, stock: 14 },
      { name: "2.6", sku: "SW-BG-SET-009-26", size: "2.6", price: 1199, mrp: 1899, stock: 20 },
      { name: "2.8", sku: "SW-BG-SET-009-28", size: "2.8", price: 1249, mrp: 1949, stock: 9 },
    ],
    flags: { isBestSeller: true, isFeatured: true },
    daysAgo: 75,
  },
  {
    name: "Peacock Stone Kada",
    category: "Bangles",
    subcategory: "Kadas",
    short: "Openable broad kada with peacock motif and green-ruby stones.",
    description: "A broad, screw-open kada featuring a peacock motif in green and ruby stones. One kada makes the whole outfit.",
    price: 0,
    mrp: 0,
    sku: "SW-BG-KDA-010",
    stock: 0,
    images: [photo(P.bangleWrist, "Peacock kada on wrist", true), photo(P.goldBangles, "Kada detail")],
    material: "Brass alloy",
    plating: "Micro gold plating",
    jewelleryType: "Kada",
    color: "Gold / Green",
    weight: "48 g",
    size: "2.4 / 2.6",
    occasion: ["Festive", "Wedding"],
    tags: ["kada", "peacock", "openable"],
    variants: [
      { name: "2.4", sku: "SW-BG-KDA-010-24", size: "2.4", price: 1349, mrp: 2199, stock: 8 },
      { name: "2.6", sku: "SW-BG-KDA-010-26", size: "2.6", price: 1349, mrp: 2199, stock: 3 },
    ],
    flags: { isTrending: true },
    daysAgo: 15,
  },
  {
    name: "Rose Gold Infinity Bracelet",
    category: "Bracelets",
    short: "Interlocking infinity links in rose gold with a box clasp.",
    description: "A fluid bracelet of interlocking infinity links, set with tiny CZs. Anti-tarnish finished and skin-friendly.",
    price: 799,
    mrp: 1299,
    sku: "SW-BR-INF-011",
    stock: 28,
    images: [photo(P.roseBracelet, "Rose gold infinity bracelet", true), photo(P.wristBracelet, "Bracelet on wrist")],
    material: "Brass alloy, CZ",
    plating: "Rose gold plating",
    jewelleryType: "Bracelet",
    color: "Rose Gold",
    weight: "12 g",
    size: "6.5 inch + extender",
    occasion: ["Party", "Daily"],
    tags: ["bracelet", "rose gold", "infinity"],
    flags: { isNewArrival: true, isFeatured: true },
    daysAgo: 8,
  },
  {
    name: "Bold Curb Chain Bracelet",
    category: "Bracelets",
    short: "Chunky curb-link bracelet in high-polish 18K gold plating.",
    description: "A statement curb chain with a toggle clasp. Stack it or wear it solo — it is made to be noticed.",
    price: 699,
    mrp: 1099,
    sku: "SW-BR-CRB-012",
    stock: 24,
    images: [photo(P.chainBracelet, "Gold curb chain bracelet", true)],
    material: "Stainless steel",
    plating: "18K gold PVD plating",
    jewelleryType: "Bracelet",
    color: "Gold",
    weight: "18 g",
    size: "7 inch",
    occasion: ["Daily", "Party"],
    tags: ["chain bracelet", "curb", "pvd"],
    daysAgo: 30,
  },
  {
    name: "Crystal Tennis Bracelet",
    category: "Party Wear",
    short: "A full line of brilliant-cut crystals in a silver-tone tennis setting.",
    description: "Red-carpet sparkle at an everyday price. Secure box clasp with safety latch.",
    price: 1099,
    mrp: 1799,
    sku: "SW-PW-TNS-013",
    stock: 16,
    images: [photo(P.tennisBracelet, "Crystal tennis bracelet", true), photo(P.crystalBracelet, "Crystal bracelet sparkle")],
    material: "Brass alloy, crystal",
    plating: "Rhodium plating",
    jewelleryType: "Tennis Bracelet",
    color: "Silver",
    weight: "14 g",
    size: "7 inch",
    occasion: ["Party", "Reception"],
    tags: ["tennis bracelet", "crystal", "party"],
    flags: { isTrending: true },
    daysAgo: 12,
  },
  {
    name: "Pink Sapphire Cocktail Ring",
    category: "Rings",
    short: "Emerald-cut pink stone framed by a CZ halo on a rose-gold band.",
    description: "A showstopping cocktail ring with an emerald-cut pink centre stone and a micro-pavé halo.",
    price: 0,
    mrp: 0,
    sku: "SW-RG-CKT-014",
    stock: 0,
    images: [photo(P.pinkRing, "Pink cocktail ring", true), photo(P.modelRing, "Ring styled on hand")],
    material: "Brass alloy, CZ",
    plating: "Rose gold plating",
    jewelleryType: "Cocktail Ring",
    color: "Rose Gold / Pink",
    weight: "5 g",
    size: "US 6 / 7 / 8",
    occasion: ["Party"],
    tags: ["ring", "cocktail", "pink"],
    variants: [
      { name: "US 6", sku: "SW-RG-CKT-014-6", size: "6", price: 599, mrp: 999, stock: 10 },
      { name: "US 7", sku: "SW-RG-CKT-014-7", size: "7", price: 599, mrp: 999, stock: 14 },
      { name: "US 8", sku: "SW-RG-CKT-014-8", size: "8", price: 599, mrp: 999, stock: 6 },
    ],
    flags: { isNewArrival: true, isFeatured: true },
    daysAgo: 2,
  },
  {
    name: "Solitaire Promise Ring",
    category: "Rings",
    short: "A raised solitaire CZ on a pavé gold-plated band.",
    description: "Timeless and minimal — a single brilliant CZ on a delicately pavé-set band.",
    price: 549,
    mrp: 899,
    sku: "SW-RG-SOL-015",
    stock: 0,
    images: [photo(P.solitaire, "Gold solitaire ring", true), photo(P.haloRing, "Halo ring detail")],
    material: "Brass alloy, CZ",
    plating: "18K gold plating",
    jewelleryType: "Ring",
    color: "Gold",
    weight: "3 g",
    size: "Adjustable",
    occasion: ["Daily", "Gifting"],
    tags: ["ring", "solitaire", "promise"],
    variants: [
      { name: "Gold", sku: "SW-RG-SOL-015-G", color: "Gold", price: 549, mrp: 899, stock: 22 },
      { name: "Silver", sku: "SW-RG-SOL-015-S", color: "Silver", price: 549, mrp: 899, stock: 18, images: [photo(P.haloRing, "Silver halo solitaire", true)] },
    ],
    flags: { isBestSeller: true },
    daysAgo: 100,
  },
  {
    name: "Emerald Vintage Statement Ring",
    category: "Party Wear",
    short: "Vintage-style ring with an emerald-green stone and filigree shank.",
    description: "Old-world filigree meets a vivid emerald-green stone. Adjustable band fits most fingers.",
    price: 649,
    mrp: 1099,
    sku: "SW-PW-EMR-016",
    stock: 12,
    images: [photo(P.emeraldRing, "Emerald statement ring", true)],
    material: "Brass alloy",
    plating: "Antique gold plating",
    jewelleryType: "Ring",
    color: "Gold / Green",
    weight: "6 g",
    size: "Adjustable",
    occasion: ["Party", "Festive"],
    tags: ["ring", "emerald", "vintage"],
    daysAgo: 25,
  },
  {
    name: "Everyday Box Chain 20\"",
    category: "Chains",
    short: "A sturdy 1.5 mm box chain in 1-gram gold plating.",
    description: "The everyday chain that does it all — wear it alone or with your favourite pendant. Lobster clasp, sweat-resistant finish.",
    price: 399,
    mrp: 699,
    sku: "SW-CH-BOX-017",
    stock: 60,
    images: [photo(P.chainModel, "Gold box chain worn", true), photo(P.layeredChains, "Layered chains")],
    material: "Brass alloy",
    plating: "1 gram gold plating",
    jewelleryType: "Chain",
    color: "Gold",
    weight: "8 g",
    size: "20 inch",
    occasion: ["Daily"],
    tags: ["chain", "box chain", "1 gram gold"],
    flags: { isBestSeller: true },
    daysAgo: 150,
  },
  {
    name: "Medallion Layered Chain Set",
    category: "Chains",
    short: "Paperclip and rope chains with a coin medallion — two layers, one clasp.",
    description: "On-trend layering made effortless: a paperclip chain and a coin medallion rope chain joined on a single clasp so they never tangle.",
    price: 849,
    mrp: 1399,
    sku: "SW-CH-LYR-018",
    stock: 20,
    images: [photo(P.layeredChains, "Layered medallion chain", true), photo(P.chainModel, "Layered chains styled")],
    material: "Stainless steel",
    plating: "18K gold PVD plating",
    jewelleryType: "Chain",
    color: "Gold",
    weight: "16 g",
    size: "16 & 18 inch",
    occasion: ["Daily", "Party"],
    tags: ["layered chain", "medallion", "coin"],
    flags: { isTrending: true, isNewArrival: true },
    daysAgo: 5,
  },
  {
    name: "Heart Pavé Pendant with Chain",
    category: "Pendants",
    short: "Open heart pendant in micro-pavé CZ on an 18-inch chain.",
    description: "A sparkling open heart that makes the perfect gift. Comes in a premium gift box.",
    price: 599,
    mrp: 999,
    sku: "SW-PD-HRT-019",
    stock: 32,
    images: [photo(P.heartPendant, "Heart pavé pendant", true), photo(P.pendants, "Pendants held in hand")],
    material: "Brass alloy, CZ",
    plating: "Rhodium plating",
    jewelleryType: "Pendant",
    color: "Silver",
    weight: "5 g",
    size: "18 inch chain",
    occasion: ["Gifting", "Daily"],
    tags: ["pendant", "heart", "gift"],
    flags: { isFeatured: true },
    daysAgo: 40,
  },
  {
    name: "Cushion-Cut Pendant Set",
    category: "Pendants",
    subcategory: "Pendant Sets",
    short: "Cushion-cut solitaire pendant with matching halo studs.",
    description: "A classic cushion-cut CZ pendant framed by a halo, paired with matching studs. Elegant for receptions and anniversaries.",
    price: 899,
    mrp: 1499,
    sku: "SW-PD-SET-020",
    stock: 15,
    images: [photo(P.squarePendant, "Cushion cut pendant", true), photo(P.diamondStuds, "Matching halo studs")],
    material: "Brass alloy, CZ",
    plating: "Rhodium plating",
    jewelleryType: "Pendant Set",
    color: "Silver",
    weight: "9 g",
    size: "18 inch chain",
    occasion: ["Party", "Gifting"],
    tags: ["pendant set", "cz", "halo"],
    daysAgo: 35,
  },
  {
    name: "Rajwadi Bridal Necklace Set",
    category: "Bridal Jewellery",
    short: "Complete bridal set: long haram, choker, jhumkas, maang tikka and nath.",
    description:
      "Everything the bride needs in one box. Rajwadi-finish haram and choker with kundan and pearl detailing, matching jhumkas, maang tikka and nath. Packed in a velvet trunk for safe keeping.",
    price: 4999,
    mrp: 8499,
    sku: "SW-BR-SET-021",
    stock: 7,
    images: [photo(P.bride, "Bride wearing Rajwadi bridal set", true), photo(P.indianSet, "Bridal necklace set"), photo(P.temple, "Bridal choker detail")],
    material: "Brass alloy, kundan, pearls",
    plating: "Rajwadi gold plating",
    jewelleryType: "Bridal Set",
    color: "Gold / Ruby / Pearl",
    weight: "320 g (full set)",
    size: "Adjustable",
    occasion: ["Wedding"],
    tags: ["bridal", "rajwadi", "kundan", "complete set"],
    flags: { isFeatured: true, isBestSeller: true },
    daysAgo: 55,
  },
  {
    name: "South Indian Bridal Temple Combo",
    category: "Bridal Jewellery",
    short: "Temple haram, choker, oddiyanam-style waist belt and jhumkas.",
    description: "A traditional South Indian bridal combo in temple design, finished in matte micro-gold plating with kemp stones.",
    price: 4599,
    mrp: 7499,
    sku: "SW-BR-SET-022",
    stock: 5,
    images: [photo(P.saree, "Bride in silk saree with temple combo", true), photo(P.temple, "Temple combo choker")],
    material: "Brass alloy, kemp stones",
    plating: "Matte micro gold plating",
    jewelleryType: "Bridal Set",
    color: "Matte Gold / Red",
    weight: "410 g (full set)",
    size: "Adjustable",
    occasion: ["Wedding"],
    tags: ["bridal", "temple", "south indian", "combo"],
    flags: { isNewArrival: true },
    daysAgo: 9,
  },
  {
    name: "Necklace + Jhumka + Bangle Combo",
    category: "Combo Sets",
    short: "A festive combo: short necklace, jhumkas and a pair of bangles.",
    description: "Our best-selling trio in one box — and priced lower than buying separately. Bangle size can be chosen below.",
    price: 0,
    mrp: 0,
    sku: "SW-CB-TRI-023",
    stock: 0,
    images: [photo(P.flatlay, "Jewellery combo flatlay", true), photo(P.goldBangles, "Combo bangles"), photo(P.goldStuds, "Combo jhumkas")],
    material: "Brass alloy",
    plating: "Micro gold plating",
    jewelleryType: "Combo Set",
    color: "Gold",
    weight: "120 g (combo)",
    size: "Bangle 2.4 / 2.6 / 2.8",
    occasion: ["Festive"],
    tags: ["combo", "necklace", "jhumka", "bangles", "value"],
    variants: [
      { name: "Bangles 2.4", sku: "SW-CB-TRI-023-24", size: "2.4", price: 1999, mrp: 3499, stock: 6 },
      { name: "Bangles 2.6", sku: "SW-CB-TRI-023-26", size: "2.6", price: 1999, mrp: 3499, stock: 10 },
      { name: "Bangles 2.8", sku: "SW-CB-TRI-023-28", size: "2.8", price: 1999, mrp: 3499, stock: 4 },
    ],
    flags: { isBestSeller: true, isTrending: true },
    daysAgo: 28,
  },
  {
    name: "Stackable Ring Trio",
    category: "Combo Sets",
    short: "Three slim stackable rings: plain, twisted and CZ-studded.",
    description: "Mix, match and stack. Three slim rings designed to sit perfectly together.",
    price: 699,
    mrp: 1199,
    sku: "SW-CB-RNG-024",
    stock: 26,
    images: [photo(P.ringsBox, "Stackable rings on box", true), photo(P.goldRings, "Gold band rings")],
    material: "Brass alloy",
    plating: "18K gold plating",
    jewelleryType: "Ring Set",
    color: "Gold",
    weight: "6 g (set)",
    size: "US 7",
    occasion: ["Daily", "Gifting"],
    tags: ["rings", "stackable", "set"],
    daysAgo: 18,
  },
  {
    name: "Minimal Solitaire Chain Necklace",
    category: "Daily Wear",
    short: "A single floating CZ on a whisper-fine 1-gram gold-plated chain.",
    description: "The quiet sparkle you will never take off. Sweat-resistant, skin-friendly and light as air.",
    price: 449,
    mrp: 799,
    sku: "SW-DW-SOL-025",
    stock: 50,
    images: [photo(P.fineNecklace, "Minimal solitaire necklace", true), photo(P.fineNecklace2, "Necklace worn with white shirt")],
    material: "Brass alloy, CZ",
    plating: "1 gram gold plating",
    jewelleryType: "Necklace",
    color: "Gold",
    weight: "3 g",
    size: "16 inch + 2 inch extender",
    occasion: ["Daily", "Office"],
    tags: ["minimal", "solitaire", "daily wear", "office"],
    flags: { isBestSeller: true, isNewArrival: true },
    daysAgo: 7,
  },
  {
    name: "Twisted Hoop Earrings",
    category: "Daily Wear",
    short: "Chunky twisted hoops in high-polish gold PVD plating.",
    description: "Water-resistant PVD-plated hoops that hold their shine. Lightweight, hollow construction.",
    price: 549,
    mrp: 899,
    sku: "SW-DW-HOP-026",
    stock: 38,
    images: [photo(P.hoops, "Twisted gold hoops", true), photo(P.hoops2, "Hoops on stone"), photo(P.hoopsPink, "Hoops on pink tray")],
    material: "Stainless steel",
    plating: "18K gold PVD plating",
    jewelleryType: "Hoops",
    color: "Gold",
    weight: "8 g (pair)",
    size: "2.5 cm",
    occasion: ["Daily", "Party"],
    tags: ["hoops", "twisted", "pvd", "waterproof"],
    flags: { isTrending: true },
    daysAgo: 11,
  },
];

const BANNERS = [
  {
    placement: "hero",
    eyebrow: "The Bridal Edit 2026",
    title: "Heirloom looks, without the heirloom price",
    subtitle: "Temple, kundan and Rajwadi bridal sets in premium micro-gold plating — handcrafted to shine through every ritual.",
    image: "/images/banners/home-hero.jpg",
    ctaLabel: "Shop Bridal",
    ctaHref: "/category/bridal-jewellery",
    secondaryCtaLabel: "New Arrivals",
    secondaryCtaHref: "/products?badge=new",
    theme: "dark",
    order: 0,
  },
  {
    placement: "hero",
    eyebrow: "Festive Season",
    title: "Gold that glows with every celebration",
    subtitle: "Harams, chokers and jhumkas made for sarees, silks and sangeets.",
    image: img(P.saree, 1800),
    ctaLabel: "Shop Necklaces",
    ctaHref: "/category/necklaces",
    secondaryCtaLabel: "Explore Jhumkas",
    secondaryCtaHref: "/category/jhumkas",
    theme: "dark",
    order: 1,
  },
  {
    placement: "promo",
    eyebrow: "Temple Collection",
    title: "Up to 40% off temple & kemp jewellery",
    subtitle: "Use code FESTIVE250 for an extra ₹250 off orders above ₹1,999.",
    image: img(P.temple, 1800),
    ctaLabel: "Shop the Collection",
    ctaHref: "/products?q=temple",
    theme: "dark",
    order: 0,
  },
] as const;

const TESTIMONIALS = [
  { author: "Priya Raman", meta: "Chennai", rating: 5, text: "Wore the Lakshmi haram for my sister's wedding and three aunties asked if it was real gold. The plating is gorgeous and it arrived beautifully packed." },
  { author: "Ananya Iyer", meta: "Bengaluru", rating: 5, text: "I wear the minimal solitaire chain every single day, even to the gym. Four months in and still no tarnish." },
  { author: "Sneha Kulkarni", meta: "Pune", rating: 4, text: "Bridal set looked stunning in photos. Delivery was quick and the team helped me pick the right bangle size on WhatsApp." },
  { author: "Fathima Nazeer", meta: "Kochi", rating: 5, text: "Finally a covering jewellery brand that feels premium. The jhumkas are light enough to wear all evening." },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (copy .env.example to .env.local)");
  await mongoose.connect(uri);
  console.log("Connected. Clearing collections…");

  await Promise.all(
    [Address, Banner, Cart, Category, Counter, Coupon, Customer, HomeSection, Order, Product, Review, Setting, Subscriber, Wishlist].map(
      (m) => (m as unknown as mongoose.Model<unknown>).deleteMany({}),
    ),
  );
  await Promise.all(
    [Address, AdminUser, Banner, Cart, Category, Coupon, Customer, HomeSection, Order, Product, Review, Setting, Subscriber, Wishlist].map(
      (m) => (m as unknown as mongoose.Model<unknown>).syncIndexes(),
    ),
  );

  // ── Settings ──────────────────────────────────────────────
  await Setting.create({
    key: "site",
    storeName: "Swarnika",
    tagline: "Covering jewellery, crafted to shine",
    logoText: "SWARNIKA",
    announcements: [
      "Free shipping on orders above ₹999",
      "New: The Bridal Edit 2026 is here",
      "Use WELCOME10 for 10% off your first order",
    ],
    contact: {
      email: "care@swarnika.in",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      address: "No. 14, Usman Road, T. Nagar, Chennai 600017",
      hours: "Mon–Sat, 10am–7pm IST",
    },
    social: {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      youtube: "https://youtube.com/",
      pinterest: "https://pinterest.com/",
    },
    shipping: { freeShippingThreshold: 999, flatRate: 79, codFee: 49, codEnabled: true, estimatedDelivery: "3–7 business days" },
    policies: {
      shipping:
        "Orders are dispatched within 24–48 hours from Chennai. Delivery takes 3–7 business days across India. Free shipping on orders above ₹999; a flat ₹79 applies below that.",
      returns:
        "Easy 7-day returns on unused pieces in original packaging. Earrings and nose pins are non-returnable for hygiene reasons unless damaged in transit.",
      care: CARE,
    },
    seo: {
      defaultTitle: "Swarnika — Premium Covering & Imitation Jewellery",
      defaultDescription:
        "Shop premium gold-plated covering jewellery — temple harams, jhumkas, bangles, bridal sets and daily wear. Anti-tarnish, skin-friendly, delivered across India.",
      ogImage: img(P.bride, 1200),
    },
  });

  // ── Categories ────────────────────────────────────────────
  const catIds = new Map<string, Types.ObjectId>();
  const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const [i, c] of CATEGORIES.entries()) {
    const parent = await Category.create({
      name: c.name,
      slug: slug(c.name),
      description: c.description,
      image: thumb(c.image),
      bannerImage: img(c.image, 1800),
      order: i,
      isFeatured: Boolean(c.featured),
      seoTitle: `${c.name} — Covering & Gold-Plated ${c.name} Online`,
      seoDescription: `${c.description} Shop ${c.name.toLowerCase()} at Swarnika with free shipping above ₹999.`,
    });
    catIds.set(c.name, parent._id);
    for (const [j, child] of (c.children ?? []).entries()) {
      const sub = await Category.create({
        name: child.name,
        slug: slug(child.name),
        description: child.description,
        image: thumb(child.image),
        parent: parent._id,
        order: j,
      });
      catIds.set(child.name, sub._id);
    }
  }
  console.log(`Seeded ${catIds.size} categories`);

  // ── Products ──────────────────────────────────────────────
  const products = [];
  for (const p of PRODUCTS) {
    const variants = (p.variants ?? []).map((v) => ({ ...v, color: v.color ?? "", size: v.size ?? "", images: v.images ?? [] }));
    const priceFrom = variants.length ? Math.min(...variants.map((v) => v.price)) : p.price;
    const mrpFrom = variants.length ? variants.find((v) => v.price === priceFrom)!.mrp : p.mrp;
    const created = new Date(Date.now() - (p.daysAgo ?? 30) * 86400000);
    const doc = await Product.create({
      name: p.name,
      slug: slug(p.name),
      description: p.description,
      shortDescription: p.short,
      category: catIds.get(p.category),
      subcategory: p.subcategory ? catIds.get(p.subcategory) : null,
      images: p.images,
      price: priceFrom,
      mrp: mrpFrom,
      sku: p.sku,
      stock: p.stock,
      material: p.material,
      plating: p.plating,
      jewelleryType: p.jewelleryType,
      occasion: p.occasion,
      color: p.color,
      weight: p.weight,
      size: p.size,
      careInstructions: CARE,
      variants,
      tags: p.tags,
      ...p.flags,
      isActive: true,
      seo: {
        title: `${p.name} | Swarnika`,
        description: p.short.slice(0, 160),
        ogImage: p.images[0]?.url ?? "",
      },
      createdAt: created,
      updatedAt: created,
    });
    products.push(doc);
  }
  console.log(`Seeded ${products.length} products`);

  // ── Banners & homepage ────────────────────────────────────
  const banners = await Banner.insertMany(BANNERS.map((b) => ({ ...b })));
  const promo = banners.find((b) => b.placement === "promo")!;
  const occasionCats = ["Daily Wear", "Party Wear", "Bridal Jewellery", "Combo Sets"].map((n) => catIds.get(n)!);

  await HomeSection.insertMany([
    { type: "featured-categories", eyebrow: "Shop by category", title: "Find your signature piece", order: 0, limit: 8 },
    { type: "best-sellers", eyebrow: "Most loved", title: "Best Sellers", subtitle: "The pieces our customers reorder again and again.", order: 1, limit: 8 },
    { type: "shop-by-type", eyebrow: "Shop by occasion", title: "Jewellery for every moment", order: 2, categories: occasionCats, limit: 4 },
    { type: "promo-banner", order: 3, banner: promo._id },
    { type: "new-arrivals", eyebrow: "Just landed", title: "New Arrivals", subtitle: "Fresh designs added every week.", order: 4, limit: 8 },
    {
      type: "why-choose-us",
      eyebrow: "The Swarnika promise",
      title: "Affordable luxury, made to last",
      order: 5,
      items: [
        { icon: "sparkles", title: "Premium micro-gold plating", text: "Multi-layer plating with anti-tarnish lacquer for a lasting glow." },
        { icon: "shield", title: "Skin-friendly & nickel-free", text: "Hypoallergenic bases tested for everyday comfort." },
        { icon: "truck", title: "Free shipping over ₹999", text: "Insured, tracked delivery to 19,000+ PIN codes." },
        { icon: "refresh", title: "Easy 7-day returns", text: "Changed your mind? Return unused pieces hassle-free." },
      ],
    },
    { type: "testimonials", eyebrow: "Loved across India", title: "What our customers say", order: 6, items: TESTIMONIALS },
    {
      type: "social-gallery",
      eyebrow: "@swarnika.jewels",
      title: "Styled by you",
      subtitle: "Tag us on Instagram for a chance to be featured.",
      order: 7,
      items: [P.bride, P.earringModel, P.layeredModel, P.modelRing, P.saree, P.chainModel].map((id) => ({
        image: thumb(id),
        href: "https://instagram.com/",
      })),
    },
    { type: "newsletter", eyebrow: "Join the circle", title: "Be first to new drops", subtitle: "Early access to collections, styling notes and members-only offers. No spam, ever.", order: 8 },
  ]);

  // ── Coupons ───────────────────────────────────────────────
  const inDays = (d: number) => new Date(Date.now() + d * 86400000);
  await Coupon.insertMany([
    { code: "WELCOME10", description: "10% off your first order (up to ₹300)", type: "percentage", value: 10, maxDiscount: 300, minOrderAmount: 499, expiresAt: inDays(180), isActive: true },
    { code: "FESTIVE250", description: "₹250 off orders above ₹1,999", type: "fixed", value: 250, minOrderAmount: 1999, expiresAt: inDays(45), usageLimit: 500, isActive: true },
    { code: "BRIDAL15", description: "15% off bridal sets (up to ₹1,000)", type: "percentage", value: 15, maxDiscount: 1000, minOrderAmount: 3999, expiresAt: inDays(90), isActive: true },
    { code: "SUMMER50", description: "Expired summer sale", type: "fixed", value: 50, minOrderAmount: 0, expiresAt: inDays(-30), isActive: true },
  ]);

  // ── Admin ─────────────────────────────────────────────────
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@swarnika.in").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe@123";
  await AdminUser.updateOne(
    { email: adminEmail },
    { $set: { name: "Store Owner", email: adminEmail, role: "owner", isActive: true, passwordHash: await bcrypt.hash(adminPassword, 12) } },
    { upsert: true },
  );

  // ── Demo customers, orders & reviews ──────────────────────
  const demoHash = await bcrypt.hash("Customer@123", 12);
  const people = [
    { name: "Priya Raman", email: "priya@example.com", phone: "9876501234", city: "Chennai", state: "Tamil Nadu", pincode: "600017" },
    { name: "Ananya Iyer", email: "ananya@example.com", phone: "9876502345", city: "Bengaluru", state: "Karnataka", pincode: "560034" },
    { name: "Sneha Kulkarni", email: "sneha@example.com", phone: "9876503456", city: "Pune", state: "Maharashtra", pincode: "411004" },
    { name: "Fathima Nazeer", email: "fathima@example.com", phone: "9876504567", city: "Kochi", state: "Kerala", pincode: "682016" },
    { name: "Meera Shah", email: "meera@example.com", phone: "9876505678", city: "Ahmedabad", state: "Gujarat", pincode: "380009" },
  ];
  const customers = [];
  for (const [i, p] of people.entries()) {
    const c = await Customer.create({
      name: p.name,
      email: p.email,
      phone: p.phone,
      passwordHash: demoHash,
      createdAt: new Date(Date.now() - (60 - i * 7) * 86400000),
    });
    await Address.create({
      customer: c._id,
      label: "Home",
      fullName: p.name,
      phone: p.phone,
      line1: `${12 + i * 7}, ${["Lake View Road", "8th Cross, Indiranagar", "FC Road", "MG Road", "CG Road"][i]}`,
      city: p.city,
      state: p.state,
      pincode: p.pincode,
      isDefault: true,
    });
    customers.push({ doc: c, ...p });
  }

  // Deterministic pseudo-random so seeds are reproducible.
  let seed = 42;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const statuses = ["delivered", "delivered", "delivered", "shipped", "processing", "confirmed", "pending", "cancelled"] as const;
  let seq = 0;
  for (let n = 0; n < 34; n++) {
    const cust = customers[Math.floor(rand() * customers.length)];
    const lines = 1 + Math.floor(rand() * 3);
    const items = [];
    for (let k = 0; k < lines; k++) {
      const prod = products[Math.floor(rand() * products.length)];
      const variant = prod.variants.length ? prod.variants[Math.floor(rand() * prod.variants.length)] : null;
      const price = variant?.price ?? prod.price;
      const mrp = variant?.mrp ?? prod.mrp;
      const qty = 1 + Math.floor(rand() * 2);
      items.push({
        product: prod._id,
        variantId: variant?._id ?? null,
        name: prod.name,
        slug: prod.slug,
        image: prod.images[0]?.thumbnail ?? "",
        sku: variant?.sku ?? prod.sku,
        variantLabel: variant?.name ?? "",
        price,
        mrp,
        quantity: qty,
        lineTotal: price * qty,
      });
    }
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const shippingFee = subtotal >= 999 ? 0 : 79;
    const cod = rand() > 0.5;
    const codFee = cod ? 49 : 0;
    const status = statuses[Math.floor(rand() * statuses.length)];
    const created = new Date(Date.now() - Math.floor(rand() * 29) * 86400000 - Math.floor(rand() * 20) * 3600000);
    seq++;
    await Order.create({
      orderNumber: `SW${100000 + seq}`,
      customer: cust.doc._id,
      contact: { name: cust.name, email: cust.email, phone: cust.phone },
      items,
      shippingAddress: { fullName: cust.name, phone: cust.phone, line1: "12, Lake View Road", city: cust.city, state: cust.state, pincode: cust.pincode },
      subtotal,
      shippingFee,
      codFee,
      total: subtotal + shippingFee + codFee,
      payment: {
        method: cod ? "cod" : "razorpay",
        status: status === "delivered" || !cod ? (status === "cancelled" && cod ? "pending" : "paid") : "pending",
        paidAt: status === "delivered" || !cod ? created : null,
      },
      status,
      statusHistory: [{ status: "pending", note: "Order placed", at: created }, ...(status !== "pending" ? [{ status, note: "", at: created }] : [])],
      stockReserved: status !== "cancelled",
      createdAt: created,
      updatedAt: created,
    });
  }
  await Counter.updateOne({ _id: "order" }, { $set: { seq } }, { upsert: true });

  // Sales counts from seeded orders.
  const sold = await Order.aggregate<{ _id: Types.ObjectId; qty: number }>([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", qty: { $sum: "$items.quantity" } } },
  ]);
  await Product.bulkWrite(sold.map((s) => ({ updateOne: { filter: { _id: s._id }, update: { $set: { salesCount: s.qty } } } })));

  // Reviews
  const reviewTexts = [
    { rating: 5, title: "Looks like real gold!", comment: "The finish is beautiful and it looks far more expensive than it is. Got compliments all evening." },
    { rating: 5, title: "Perfect for festivals", comment: "Wore it for Diwali and Karthigai — still shining. Packaging was lovely too." },
    { rating: 4, title: "Very pretty", comment: "Slightly smaller than I imagined but the detailing is lovely and the plating is even." },
    { rating: 5, title: "Lightweight and comfortable", comment: "No itching or irritation even after a full day. Will definitely buy more." },
    { rating: 4, title: "Good value", comment: "Great quality for the price. Delivery took four days to Pune." },
  ];
  let reviewCount = 0;
  for (const [i, prod] of products.entries()) {
    const count = i % 4 === 3 ? 0 : 2 + (i % 3);
    for (let r = 0; r < count; r++) {
      const cust = customers[(i + r) % customers.length];
      const t = reviewTexts[(i + r) % reviewTexts.length];
      await Review.create({
        product: prod._id,
        customer: cust.doc._id,
        name: cust.name,
        location: cust.city,
        ...t,
        isVerifiedPurchase: r % 2 === 0,
        createdAt: new Date(Date.now() - (r + 1) * 5 * 86400000),
      });
      reviewCount++;
    }
    const [agg] = await Review.aggregate<{ avg: number; n: number }>([
      { $match: { product: prod._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
    ]);
    await Product.updateOne({ _id: prod._id }, { $set: { ratings: Math.round((agg?.avg ?? 0) * 10) / 10, reviewCount: agg?.n ?? 0 } });
  }

  console.log(`Seeded ${customers.length} customers, ${seq} orders, ${reviewCount} reviews`);
  console.log(`\nAdmin login:     ${adminEmail} / ${adminPassword}`);
  console.log(`Demo customer:   priya@example.com / Customer@123`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
