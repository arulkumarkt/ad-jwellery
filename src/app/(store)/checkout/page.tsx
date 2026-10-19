import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getVerifiedCustomer } from "@/lib/auth";
import { paymentsEnabled } from "@/lib/env";
import { getProfile, listAddresses } from "@/services/account.service";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const customer = await getVerifiedCustomer();
  const [settings, addresses, profile] = await Promise.all([
    getSettings(),
    customer ? listAddresses(customer.id) : Promise.resolve([]),
    customer ? getProfile(customer.id).catch(() => null) : Promise.resolve(null),
  ]);

  return (
    <div className="container-lux pb-16 pt-6 sm:pt-10">
      <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
        <span className="eyebrow inline-flex items-center gap-2">
          <Lock className="size-3" /> Secure checkout
        </span>
        <h1 className="mt-2 text-4xl text-charcoal sm:text-5xl">Checkout</h1>
        <span className="hairline mt-4 w-24" aria-hidden />
      </div>
      <CheckoutFlow
        customer={customer}
        profile={profile ? { name: profile.name, email: profile.email, phone: profile.phone ?? "" } : null}
        addresses={addresses}
        settings={settings}
        paymentsEnabled={paymentsEnabled()}
      />
    </div>
  );
}
