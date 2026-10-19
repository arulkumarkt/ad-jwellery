# Swarnika — Covering Jewellery Store

A full-stack e-commerce app for covering and imitation jewellery. It is built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Framer Motion, MongoDB and Mongoose.

## Quick start

```bash
cp .env.example .env.local     # then set MONGODB_URI and NEXTAUTH_SECRET
npm install
npm run db:local               # optional: starts a local MongoDB on :27017 (data in .mongo-data/)
npm run seed                   # catalogue, homepage content, coupons, admin, demo orders
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin. The login comes from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default `admin@swarnika.in` / `ChangeMe@123`).
- Demo customer: `priya@example.com` / `Customer@123`
- Demo coupons: `WELCOME10`, `FESTIVE250`, `BRIDAL15`. `SUMMER50` is seeded as expired.

Generate a secret with `openssl rand -base64 48`.

## Architecture

```
src/
  app/(store)/      storefront pages (home, products, category, product, cart, checkout, wishlist, account, auth)
  app/admin/        admin panel ((auth)/login and (panel)/… behind the admin session)
  app/api/          REST route handlers (thin: validate, then call a service)
  services/         business logic and MongoDB queries (server-only)
  models/           Mongoose schemas and indexes
  lib/              auth (JWT cookies), api helpers, validators (zod), pricing, payment, storage, cache tags
  components/       motion primitives, layout, home, catalog, product, cart, checkout, account, admin, ui
  types/            serialised DTOs shared by server and client
  proxy.ts          route protection for /account and /admin (Next 16 "proxy", formerly middleware)
scripts/            seed.ts, local-mongo.mjs
```

**Data flow.** Client components call the REST APIs (`/api/*`). Server components call the same `services/*` functions directly, so there is no HTTP round-trip to the app's own API. Either way, all data comes from MongoDB through one service layer.

**Caching.** Catalogue reads (products, categories, home sections, banners, settings, reviews) use `unstable_cache` with tags. Every admin mutation calls `revalidateTag(tag, { expire: 0 })` through `lib/cache.ts`, so storefront changes show on the next request. Pages render on demand, so no database is needed at build time.

**Auth.** Customers and admins live in separate collections and use separate cookies. Admin cookies are `SameSite=Strict` and are re-validated against the database on every request. Sessions are HS256 JWTs in httpOnly cookies, and passwords are hashed with bcrypt (cost 12). A `sessionVersion` field lets a password change or account disable revoke sessions. Admin roles are `owner`, `manager` and `staff`. Mutating API calls reject cross-origin requests, and login, registration, checkout and coupon endpoints are rate-limited per instance.

**Cart and checkout.** Guests get a cart and wishlist keyed by an anonymous cookie, which merge into the account on login. All prices, coupons, shipping and COD fees are recomputed on the server. Stock is reserved atomically with conditional updates and released when an order is cancelled or returned. Order items are stored as snapshots, so later product edits don't change placed orders.

**Payments.** Cash on Delivery works out of the box. Razorpay turns on when `PAYMENT_SECRET_KEY` (secret) and `NEXT_PUBLIC_PAYMENT_KEY` (key id) are set. Payment signatures are verified on the server with HMAC-SHA256.

**Images.** Set `IMAGE_STORAGE_PROVIDER=local` to write to `public/uploads` (single server only). Set it to `cloudinary` for signed uploads: `IMAGE_STORAGE_URL` is the upload endpoint, and `IMAGE_STORAGE_API_KEY` is `key:secret`. Products keep image URLs only, with main, gallery, thumbnail and per-variant images. Add extra image hosts with `NEXT_PUBLIC_IMAGE_HOSTS`.

**SEO.** The app sets per-page metadata, canonical URLs, Open Graph and Twitter tags, and generates `/sitemap.xml` and `/robots.txt`. It also emits structured data: Product and AggregateOffer on product pages, BreadcrumbList, and JewelryStore with SearchAction.

**Animation.** Shared primitives live in `components/motion` (`Reveal`, `Stagger`, `ImageReveal`, `Parallax`, `SectionHeading`, `PageTransition`, `RouteProgress`), all using one easing curve. `MotionConfig reducedMotion="user"` respects `prefers-reduced-motion`.

## Production notes

- Use a MongoDB replica set or Atlas. Indexes are declared on the schemas; run `syncIndexes`, or let the seed do it.
- The in-memory rate limiter works per instance. Use Redis or Upstash when you scale out.
- On serverless hosts, use the `cloudinary` image provider.
- Add a Razorpay webhook for payments captured after the browser closes. This is not included yet.
