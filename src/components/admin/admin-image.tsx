import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Plain <img> for admin previews: sources may be uploads, arbitrary CDNs or
 * pasted URLs that aren't whitelisted for next/image optimisation.
 */
export function AdminImage({ src, alt = "", className }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-cream text-gold-400", className)} aria-hidden>
        <ImageIcon className="size-1/3 max-h-6 max-w-6" strokeWidth={1.4} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
