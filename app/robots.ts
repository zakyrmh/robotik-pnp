import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/verify-email",
        "/verified",
        "/callback",
        "/dashboard",
        "/presensi",
        "/kegiatan",
        "/manajemen-caang",
        "/manajemen-kelompok",
        "/manajemen-struktur",
        "/pengaturan-or",
        "/piket",
        "/tugas",
        "/onboarding",
        "/waiting",
        "/rejected",
        "/deleted",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
