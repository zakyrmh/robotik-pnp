"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Clock, Newspaper, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type ArticleWithAuthor = Pick<
  ArticleRow,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "category"
  | "cover_image_url"
  | "published_at"
> & {
  profiles: Pick<ProfileRow, "id" | "email" | "nim"> | null;
};

interface ArtikelClientProps {
  articles: ArticleWithAuthor[];
}

const CATEGORIES = [
  "Semua",
  "Riset & Teknologi",
  "Kabar Robotik",
  "Kompetisi",
  "Tutorial",
];

export default function ArtikelClient({ articles }: ArtikelClientProps) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const displayArticles = articles;

  const filteredArticles = displayArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt &&
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      activeCategory === "Semua" || article.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredArticle =
    filteredArticles.length > 0 ? filteredArticles[0] : null;
  const gridArticles =
    activeCategory === "Semua" && !searchQuery
      ? filteredArticles.slice(1)
      : filteredArticles;

  return (
    <div className="container mx-auto px-4 max-w-7xl pb-24">
      {/* Hero Featured Section */}
      {featuredArticle && activeCategory === "Semua" && !searchQuery && (
        <section className="py-6 sm:py-8 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:border-primary/50 hover:shadow-soft transition-all duration-200"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-auto min-h-[320px] bg-secondary overflow-hidden">
                {featuredArticle.cover_image_url ? (
                  <Image
                    src={featuredArticle.cover_image_url}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                    <Newspaper className="size-16 mb-2" />
                    <span className="font-mono text-sm uppercase tracking-widest font-bold">
                      ROBOTIK PNP
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-card/60 via-transparent to-transparent lg:hidden" />
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider text-accent-strong bg-accent dark:bg-accent/20 px-2.5 py-1 rounded-md border border-border">
                      {featuredArticle.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> 5 min read
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {featuredArticle.title}
                  </h2>

                  <p className="font-body text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-border/70">
                  <div className="text-xs font-mono text-muted-foreground">
                    {featuredArticle.profiles?.email || "Admin"} •{" "}
                    {new Date(
                      featuredArticle.published_at || "",
                    ).toLocaleDateString("id-ID")}
                  </div>

                  <Link
                    href={`/artikel/${featuredArticle.slug}`}
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-body font-medium text-xs sm:text-sm px-5 py-2.5 rounded-md shadow-xs transition-all active:scale-[0.98] min-h-[40px]"
                  >
                    <span>Baca</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Filter Category & Search Bar */}
      <section className="mb-10 sticky top-20 z-20 bg-background/80 backdrop-blur-md py-4 border-y border-border transition-colors">
        <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-1 md:pb-0 hide-scrollbar w-full md:w-auto gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-3.5 py-2 font-mono text-xs uppercase font-semibold rounded-lg border transition-all cursor-pointer min-h-[38px] ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 font-body text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[38px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {gridArticles.map((article, index) => (
            <motion.div
              key={article.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="group bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:border-primary/50 hover:shadow-soft transition-all duration-200 flex flex-col relative"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors duration-200 z-10" />

              <Link
                href={`/artikel/${article.slug}`}
                className="flex-1 flex flex-col"
              >
                {/* Cover Image */}
                <div className="relative aspect-video bg-secondary overflow-hidden border-b border-border">
                  {article.cover_image_url ? (
                    <Image
                      src={article.cover_image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                      <Newspaper className="size-10 mb-1" />
                      <span className="font-mono text-xs uppercase tracking-widest font-bold">
                        ROBOTIK PNP
                      </span>
                    </div>
                  )}

                  {/* Category Pill Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-card/90 dark:bg-card/80 border border-border text-foreground shadow-2xs">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="font-body text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-border/70 flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <User className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">
                        {article.profiles?.email || "Admin"}
                      </span>
                    </span>
                    <span>
                      {new Date(article.published_at || "").toLocaleDateString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredArticles.length === 0 && (
        <div className="text-center py-20 bg-card border border-border rounded-xl p-8 shadow-2xs mt-6">
          <Newspaper className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-body text-sm sm:text-base text-muted-foreground">
            Tidak ada artikel yang cocok dengan pencarian.
          </p>
        </div>
      )}
    </div>
  );
}
