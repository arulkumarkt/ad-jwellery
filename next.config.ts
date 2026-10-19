import type { NextConfig } from "next";

const extraImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Data is cached with tagged `unstable_cache` entries and revalidated from
  // admin mutations, so pages render on demand without needing a DB at build.
  cacheComponents: false,
  poweredByHeader: false,
  serverExternalPackages: ["mongoose"],
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ik.imagekit.io" },
      ...extraImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
