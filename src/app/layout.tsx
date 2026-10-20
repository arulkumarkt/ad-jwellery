import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { getSettings } from "@/services/settings.service";
import { absoluteUrl, shareImage } from "@/lib/utils";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Every page reads live catalogue data (through tagged caches), so render on demand.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings().catch(() => null);
  const title = s?.seo.defaultTitle || "Swarnika — Premium Covering Jewellery";
  const description =
    s?.seo.defaultDescription || "Premium gold-plated covering and imitation jewellery, delivered across India.";
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: { default: title, template: `%s | ${s?.storeName ?? "Swarnika"}` },
    description,
    applicationName: s?.storeName ?? "Swarnika",
    openGraph: {
      type: "website",
      siteName: s?.storeName ?? "Swarnika",
      title,
      description,
      images: s?.seo.ogImage ? [{ url: shareImage(s.seo.ogImage), width: 1200, height: 630 }] : undefined,
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title, description, images: s?.seo.ogImage ? [shareImage(s.seo.ogImage)] : undefined },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
