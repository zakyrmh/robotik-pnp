"use server";

import { createClient } from "@/lib/supabase/server";
import { ArticleWithAuthor } from "@/app/(marketing)/artikel/ArtikelClient";

export async function getArticlesAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        category,
        cover_image_url,
        published_at,
        profiles (
          id,
          email,
          nim
        )
      `)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Failed to get articles:", error.message);
      return [];
    }

    return data as unknown as ArticleWithAuthor[];
  } catch (error) {
    console.error("Failed to get articles action:", error);
    return [];
  }
}

export async function getArticleBySlugAction(slug: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        category,
        cover_image_url,
        published_at,
        profiles (
          id,
          email,
          nim
        )
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error(`Failed to get article by slug ${slug}:`, error.message);
      return null;
    }

    return data as unknown as ArticleWithAuthor;
  } catch (error) {
    console.error(`Failed to get article by slug ${slug} action:`, error);
    return null;
  }
}
