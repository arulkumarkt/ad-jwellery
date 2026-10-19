import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { RegisterForm } from "@/components/account/register-form";
import { safeNext } from "@/components/account/form-utils";

export const metadata: Metadata = {
  title: "Create account",
  description: "Join Swarnika for faster checkout, order tracking and early access to new collections.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next);
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <AuthShell
      eyebrow="Join the circle"
      title="Create your account"
      subtitle="Save your favourites, track deliveries and enjoy members-only offers."
      quote={{ text: "Heirloom beauty, made for every day — and every budget.", author: "Swarnika" }}
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-charcoal underline decoration-gold-300 underline-offset-4 hover:text-gold-700">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
