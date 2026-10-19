import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";
import { OrderCard } from "@/components/account/order-card";
import { ProfileForm } from "@/components/account/profile-form";
import { NoOrdersState } from "@/components/account/empty-states";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getVerifiedCustomer } from "@/lib/auth";
import { getProfile, listAddresses } from "@/services/account.service";
import { listCustomerOrders } from "@/services/order.service";
import { getWishlist } from "@/services/wishlist.service";

export const metadata: Metadata = { title: "My account" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function AccountOverviewPage() {
  const customer = await getVerifiedCustomer();
  if (!customer) redirect("/login?next=/account");
  const [profile, orders, wishlist, addresses] = await Promise.all([
    getProfile(customer.id),
    listCustomerOrders(customer.id, 1, 3),
    getWishlist({ customerId: customer.id, guestId: null }),
    listAddresses(customer.id),
  ]);

  const stats = [
    { label: "Orders", value: orders.total, href: "/account/orders", icon: Package },
    { label: "Wishlist", value: wishlist.productIds.length, href: "/wishlist", icon: Heart },
    { label: "Addresses", value: addresses.length, href: "/account/addresses", icon: MapPin },
  ];

  return (
    <div className="flex flex-col gap-10">
      <Reveal className="relative overflow-hidden rounded-3xl bg-charcoal p-6 text-ivory shadow-lift sm:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full border border-gold-300/30" />
        <div aria-hidden className="absolute -right-4 top-10 size-40 rounded-full bg-gold-500/15 blur-3xl" />
        <span className="eyebrow !text-gold-200">{greeting()}</span>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          Hello, <span className="text-gold-gradient">{profile.name.split(" ")[0]}</span>
        </h1>
        <p className="mt-2 max-w-md text-sm text-ivory/70">
          Member since {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))}. Here&apos;s everything in one place.
        </p>
      </Reveal>

      <Stagger className="grid grid-cols-3 gap-3 sm:gap-5">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Link
              href={s.href}
              className="group flex h-full flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-gold-200 hover:shadow-lift sm:p-6"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-100">
                <s.icon className="size-[18px]" strokeWidth={1.6} />
              </span>
              <span className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">{s.value}</span>
              <span className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-stone">
                {s.label}
                <ArrowRight className="hidden size-4 transition group-hover:translate-x-0.5 group-hover:text-gold-600 sm:block" />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <span className="eyebrow">Recent</span>
            <h2 className="mt-1 text-3xl text-charcoal">Your latest orders</h2>
          </div>
          {orders.total > 0 && (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-charcoal hover:text-gold-700">
              View all <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {orders.items.length ? (
          <Stagger className="grid gap-4">
            {orders.items.map((o) => (
              <StaggerItem key={o._id}>
                <OrderCard order={o} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="rounded-3xl border border-border bg-card">
            <NoOrdersState />
          </div>
        )}
      </section>

      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <span className="eyebrow">Profile</span>
          <h2 className="mb-6 mt-1 text-3xl text-charcoal">Personal details</h2>
          <ProfileForm profile={profile} />
        </section>
      </Reveal>
    </div>
  );
}
