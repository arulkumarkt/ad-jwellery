import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-lux flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-5xl sm:text-7xl">
        This piece has <span className="text-gold-gradient italic">wandered off</span>
      </h1>
      <p className="mt-4 max-w-md text-stone">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonVariants({ size: "xl" })}>Back to home</Link>
        <Link href="/products" className={buttonVariants({ variant: "outline", size: "xl" })}>Shop all</Link>
      </div>
    </section>
  );
}
