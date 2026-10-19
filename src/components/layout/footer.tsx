import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/common/logo";
import type { CategoryDTO, SiteSettingsDTO } from "@/types";

function SocialIcon({ name }: { name: "instagram" | "facebook" | "youtube" | "pinterest" }) {
  const paths: Record<typeof name, string> = {
    instagram:
      "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 100 10.2 5.1 5.1 0 000-10.2zm0 8.4a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6zm5.3-9.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z",
    facebook: "M14 8h3V4h-3c-2.8 0-4.5 1.7-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z",
    youtube:
      "M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2 31 31 0 00.6 12a31 31 0 00.4 4.8 3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1 31 31 0 00.4-4.8 31 31 0 00-.4-4.8zM9.8 15.1V8.9l5.4 3.1-5.4 3.1z",
    pinterest:
      "M12 2a10 10 0 00-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.4 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2.9-.9 2.1-1.4 2.8A10 10 0 1012 2z",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}

export function Footer({ settings, categories }: { settings: SiteSettingsDTO; categories: CategoryDTO[] }) {
  const socials = (Object.entries(settings.social) as [keyof SiteSettingsDTO["social"], string][]).filter(([, url]) => url);
  return (
    <footer className="relative mt-24 overflow-hidden bg-charcoal text-ivory/80">
      <div className="hairline absolute inset-x-0 top-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
        aria-hidden
      />
      <div className="container-lux relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo text={settings.logoText} light className="!items-start" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
            {settings.tagline}. Premium gold-plated covering jewellery, designed in India for every celebration and every day.
          </p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={name}
                  className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition hover:-translate-y-0.5 hover:border-gold-300 hover:text-gold-200"
                >
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">Shop</h3>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 7).map((c) => (
              <li key={c._id}>
                <Link href={`/category/${c.slug}`} className="transition hover:text-ivory">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">Help</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/account/orders" className="transition hover:text-ivory">Track order</Link></li>
            <li><Link href="/policies#shipping" className="transition hover:text-ivory">Shipping</Link></li>
            <li><Link href="/policies#returns" className="transition hover:text-ivory">Returns & exchange</Link></li>
            <li><Link href="/policies#care" className="transition hover:text-ivory">Jewellery care</Link></li>
            <li><Link href="/account" className="transition hover:text-ivory">My account</Link></li>
            <li><Link href="/wishlist" className="transition hover:text-ivory">Wishlist</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-gold-200">Visit & contact</h3>
          <ul className="space-y-3 text-sm">
            {settings.contact.address && (
              <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-300" />{settings.contact.address}</li>
            )}
            {settings.contact.phone && (
              <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-gold-300" />
                <a href={`tel:${settings.contact.phone.replace(/\s/g, "")}`} className="hover:text-ivory">{settings.contact.phone}</a>
              </li>
            )}
            {settings.contact.email && (
              <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-gold-300" />
                <a href={`mailto:${settings.contact.email}`} className="hover:text-ivory">{settings.contact.email}</a>
              </li>
            )}
            {settings.contact.hours && (
              <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-gold-300" />{settings.contact.hours}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-lux flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>UPI · Cards · Netbanking · Cash on Delivery</span>
            <span className="hidden sm:inline">·</span>
            <span>Secure checkout</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
