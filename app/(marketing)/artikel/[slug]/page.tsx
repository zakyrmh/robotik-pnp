import type { Metadata } from "next";
import { getArticleBySlugAction } from "@/lib/actions/articles";
import { ArrowLeft, Clock, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleWithAuthor } from "../ArtikelClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const article = (await getArticleBySlugAction(
    resolvedParams.slug,
  )) as ArticleWithAuthor | null;

  if (!article) {
    return { title: "Artikel Tidak Ditemukan" };
  }

  return {
    title: `${article.title} — UKM Robotik PNP`,
    description:
      article.excerpt || "Artikel dari UKM Robotika Politeknik Negeri Padang",
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const article = (await getArticleBySlugAction(
    resolvedParams.slug,
  )) as ArticleWithAuthor | null;

  if (!article) {
    notFound();
  }

  return (
    <div className="bg-canvas-light text-foreground min-h-screen pt-24 pb-24">
      {/* Switch polarity: Dark canvas header, Light canvas content (The Typographic Joke & Polarity rules) */}
      <article className="max-w-3xl mx-auto px-4">
        <Link
          href="/artikel"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-cyber-blue font-jetbrains text-sm uppercase mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Artikel
        </Link>

        <header className="mb-12 space-y-6">
          <div className="flex items-center gap-4 text-mono-eyebrow font-jetbrains uppercase">
            <span className="text-cyber-blue bg-cyber-blue/10 px-3 py-1 rounded-sm">
              {article?.category}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> 5 min read
            </span>
          </div>

          <h1 className="text-display-xl font-bold uppercase tracking-tight text-foreground leading-tight">
            {article?.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-hairline-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-tech-navy flex items-center justify-center text-white font-jetbrains">
                {article?.profiles?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div>
                <p className="font-jetbrains text-sm font-bold">
                  {article?.profiles?.email || "Tim Publikasi"}
                </p>
                <p className="font-jetbrains text-xs text-muted-foreground">
                  {new Date(article?.published_at || "").toLocaleDateString(
                    "id-ID",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </p>
              </div>
            </div>
            <button className="p-2 text-muted-foreground hover:text-cyber-blue transition-colors border border-hairline-light hover:border-cyber-blue rounded-sm">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Cover Image */}
        {article?.cover_image_url ? (
          <div className="relative w-full h-80 md:h-[400px] mb-12 overflow-hidden border border-hairline-light">
            <Image
              src={article.cover_image_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-80 bg-surface-soft-light border border-hairline-light mb-12 flex items-center justify-center">
            <span className="font-jetbrains text-muted-foreground opacity-50 uppercase tracking-widest">
              Image Content Placeholder
            </span>
          </div>
        )}

        {/* Content Body - Using simple prose styles for markdown text simulation */}
        <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight prose-a:text-cyber-blue hover:prose-a:text-tech-navy prose-img:rounded-sm max-w-none font-sans text-body-md font-light leading-relaxed">
          <div
            dangerouslySetInnerHTML={{
              __html: article?.content.replace(/\n/g, "<br/>") || "",
            }}
          />
        </div>

        <div className="mt-16 pt-8 border-t border-hairline-light">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-surface-soft-light text-muted-foreground font-jetbrains text-xs uppercase border border-hairline-light">
              Tags:
            </span>
            <span className="px-3 py-1 bg-surface-soft-light hover:bg-cyber-blue/10 hover:text-cyber-blue cursor-pointer text-muted-foreground font-jetbrains text-xs uppercase border border-hairline-light transition-colors">
              Robotik
            </span>
            <span className="px-3 py-1 bg-surface-soft-light hover:bg-cyber-blue/10 hover:text-cyber-blue cursor-pointer text-muted-foreground font-jetbrains text-xs uppercase border border-hairline-light transition-colors">
              Teknologi
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
