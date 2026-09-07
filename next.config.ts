import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL:
      process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY:
      process.env.MIDTRANS_CLIENT_KEY ||
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    NEXT_PUBLIC_SENTRY_DSN:
      process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    SITE_URL: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL,
    APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    TURNSTILE_SITE_KEY:
      process.env.TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    MIDTRANS_CLIENT_KEY:
      process.env.MIDTRANS_CLIENT_KEY ||
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
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
      {
        protocol: "https",
        hostname: "quickchart.io",
      },
      {
        protocol: "https",
        hostname: "api.midtrans.com",
      },
      {
        protocol: "https",
        hostname: "api.sandbox.midtrans.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.cloudflarestorage.com",
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

  // Senyapkan log jika bukan lingkungan CI
  silent: !process.env.CI,
});
