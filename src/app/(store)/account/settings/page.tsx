import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LogoutButton } from "@/components/account/logout-button";
import { PasswordForm } from "@/components/account/password-form";
import { Reveal } from "@/components/motion";
import { getVerifiedCustomer } from "@/lib/auth";

export const metadata: Metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const customer = await getVerifiedCustomer();
  if (!customer) redirect("/login?next=/account/settings");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="eyebrow">Security</span>
        <h1 className="mt-2 text-3xl text-charcoal sm:text-4xl">Account settings</h1>
        <p className="mt-1 text-sm text-stone">Signed in as {customer.email}</p>
      </div>
      <Reveal>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-100">
              <ShieldCheck className="size-5" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="text-2xl text-charcoal">Change password</h2>
              <p className="text-sm text-stone">Use a unique password you don&apos;t use elsewhere.</p>
            </div>
          </div>
          <PasswordForm />
        </section>
      </Reveal>
      <Reveal delay={0.08}>
        <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-2xl text-charcoal">Sign out</h2>
            <p className="text-sm text-stone">Sign out of your account on this device.</p>
          </div>
          <LogoutButton className="h-12 justify-center rounded-full border border-border px-6 text-charcoal hover:border-destructive/30 hover:bg-destructive/5" />
        </section>
      </Reveal>
    </div>
  );
}
