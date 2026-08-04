import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    // Izinkan IP lokal hanya saat development (Next.js 16+ perlindungan SSRF)
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry Options
  org: process.env.SENTRY_ORG || "unit-kegiatan-mahasiswa-roboti",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",

  // Hapus file source map setelah upload untuk keamanan kode sumber
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Nonaktifkan logger Sentry saat build
  disableLogger: true,

  // Senyapkan log jika bukan lingkungan CI
  silent: !process.env.CI,
});
