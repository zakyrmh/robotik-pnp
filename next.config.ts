import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Izinkan IP lokal hanya saat development (Next.js 16+ perlindungan SSRF)
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321", // Opsional: Bisa dispesifikasikan langsung ke port Supabase lokal
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "::1",
      },
      {
        protocol: "https",
        hostname: "::1",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;