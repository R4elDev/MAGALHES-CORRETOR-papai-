import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseUrl ? [{ protocol: "https", hostname: new URL(supabaseUrl).hostname }] : [],
  },
};

export default nextConfig;
