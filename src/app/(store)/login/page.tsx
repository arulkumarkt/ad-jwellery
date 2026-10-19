import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/login-form";
import { safeNext } from "@/components/account/form-utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Swarnika account to track orders, save addresses and check out faster.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next);
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Swarnika"
      subtitle="Track your orders, revisit your wishlist and check out in seconds."
      quote={{ text: "Jewellery is the quiet poetry of every celebration.", author: "The Swarnika atelier" }}
      footer={
        <>
          New to Swarnika?{" "}
          <Link href={registerHref} className="font-medium text-charcoal underline decoration-gold-300 underline-offset-4 hover:text-gold-700">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
