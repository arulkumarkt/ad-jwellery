import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-soft">
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-200">
        <SearchX className="size-6" />
      </div>
      <h1 className="font-display text-3xl text-charcoal">Not found</h1>
      <p className="mt-2 text-sm text-stone">This record doesn&apos;t exist or may have been deleted.</p>
      <Link href="/admin" className={buttonVariants({ size: "lg", className: "mt-7" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
