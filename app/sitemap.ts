import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://robotik-pnp.vercel.app"
  ).replace(/\/$/, "");

  // 1. Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/profil`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/divisi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/prestasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/keanggotaan`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artikel`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hubungi-kami`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Initialize Supabase admin client to bypass RLS and read public content safely
  const supabase = createAdminClient();

  // 2. Fetch active divisions from Supabase, fallback to static if empty
  let divisionPages: MetadataRoute.Sitemap = [];
  try {
    const { data: dbDivisions } = await supabase
      .from("divisions")
      .select("slug, created_at")
      .eq("is_active", true);

    const divisionSlugs =
      dbDivisions && dbDivisions.length > 0
        ? dbDivisions.map((d) => ({
            slug: d.slug,
            lastModified: d.created_at ? new Date(d.created_at) : new Date(),
          }))
        : [
            { slug: "krai", lastModified: new Date() },
            { slug: "krsbi-b", lastModified: new Date() },
            { slug: "krsbi-h", lastModified: new Date() },
            { slug: "krsti", lastModified: new Date() },
            { slug: "krsri", lastModified: new Date() },
          ];

    divisionPages = divisionSlugs.map((item) => ({
      url: `${baseUrl}/divisi/${item.slug}`,
      lastModified: item.lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Failed to generate sitemap for divisions:", error);
    // Hard fallback to guarantee division pages are present
    const slugs = ["krai", "krsbi-b", "krsbi-h", "krsti", "krsri"];
    divisionPages = slugs.map((slug) => ({
      url: `${baseUrl}/divisi/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  }

  // 3. Fetch published articles from Supabase
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const { data: dbArticles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("is_published", true);

    if (dbArticles && dbArticles.length > 0) {
      articlePages = dbArticles.map((article) => ({
        url: `${baseUrl}/artikel/${article.slug}`,
        lastModified: article.updated_at
          ? new Date(article.updated_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Failed to generate sitemap for articles:", error);
  }

  return [...staticPages, ...divisionPages, ...articlePages];
}
