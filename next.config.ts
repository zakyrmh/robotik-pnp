import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 public access via r2.dev subdomain
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      // Cloudflare R2 S3-compatible endpoint (fallback/legacy)
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
