"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-border bg-white px-6 py-16 text-center shadow-soft">
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
        <TriangleAlert className="size-6" />
      </div>
      <h1 className="font-display text-3xl text-charcoal">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone">
        We couldn&apos;t load this page. It may be a temporary issue with the database connection.
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-stone/70">Ref: {error.digest}</p>}
      <div className="mt-7 flex gap-2">
        <Button size="lg" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
