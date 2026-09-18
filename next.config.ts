import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder photography source. Replace with your own CDN / Supabase /
    // Shopify domain when real product photography is available.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 640, 768, 1024, 1280, 1440, 1920],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    serverActions: {
      // Only matters without Supabase, when product photos travel inside the
      // form to be written to public/uploads: 8 photos × 5 MB plus multipart
      // overhead. With Supabase the browser uploads straight to Storage and
      // the action sees URLs only — which is the only path that works on
      // Vercel, whose 4.5 MB request cap no setting here can lift.
      bodySizeLimit: "45mb",
    },
  },
};

export default nextConfig;
