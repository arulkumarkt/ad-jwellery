import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ text = "SWARNIKA", className, light }: { text?: string; className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label={`${text} home`} className={cn("group inline-flex flex-col items-center leading-none", className)}>
      <span
        className={cn(
          "font-display text-2xl font-semibold tracking-[0.32em] transition-colors sm:text-[1.7rem]",
          light ? "text-ivory" : "text-charcoal",
        )}
      >
        {text}
      </span>
      <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.5em] text-gold-500">Covering Jewellery</span>
    </Link>
  );
}
