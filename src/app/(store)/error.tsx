"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-lux flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 text-4xl sm:text-6xl">We couldn&apos;t load this page</h1>
      <p className="mt-4 max-w-md text-stone">Please try again. If the problem continues, our team has been notified.</p>
      <Button size="xl" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
