import type { ImageLoaderProps } from "next/image";

/**
 * next/image loader. ImageKit and Unsplash resize on their own CDNs, so we hand
 * them the size directly instead of proxying through /_next/image.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality ?? 75;
  if (src.startsWith("https://ik.imagekit.io/")) {
    const [base] = src.split("?");
    return `${base}?tr=w-${width},q-${q}`;
  }
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(q));
    url.searchParams.set("auto", "format");
    return url.toString();
  }
  if (src.startsWith("https://res.cloudinary.com/")) {
    return src.replace("/upload/", `/upload/w_${width},q_${q},f_auto/`);
  }
  return src;
}
