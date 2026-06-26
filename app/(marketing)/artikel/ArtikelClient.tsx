"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Clock } from "lucide-react";
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
  const gridArticles = filteredArticles.slice(1);

  return (
    <div className="container mx-auto px-4 max-w-7xl pb-24">
      {/* Hero Featured Section */}
      {featuredArticle && activeCategory === "Semua" && !searchQuery && (
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-surface-card-dark border border-hairline-dark rounded-none overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-64 lg:h-auto min-h-[400px] bg-canvas-dark overflow-hidden">
                {featuredArticle.cover_image_url ? (
                  <Image
                    src={featuredArticle.cover_image_url}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-linear-to-tr from-cyber-blue/20 to-surface-card-dark z-0 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-jetbrains text-display-xl text-foreground opacity-10">
                        ROBOTIK
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-4 text-mono-eyebrow font-jetbrains text-muted-foreground uppercase">
                  <span className="text-cyber-blue bg-cyber-blue/10 px-3 py-1">
                    {featuredArticle.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 5 min read
                  </span>
                </div>
                <h2 className="text-display-lg font-bold text-foreground leading-tight">
                  {featuredArticle.title}
                </h2>
                <p className="text-body-md text-muted-foreground line-clamp-3">
                  {featuredArticle.excerpt}
                </p>
                <div className="pt-4 flex items-center justify-between border-t border-hairline-dark">
                  <div className="text-sm font-jetbrains text-muted-foreground">
                    {featuredArticle.profiles?.email || "Admin"} •{" "}
                    {new Date(
                      featuredArticle.published_at || "",
                    ).toLocaleDateString("id-ID")}
                  </div>
                  <Link
                    href={`/artikel/${featuredArticle.slug}`}
                    className="flex items-center gap-2 bg-foreground text-background px-6 py-3 font-jetbrains text-mono-button hover:bg-cyber-blue hover:text-white transition-colors uppercase rounded-none"
                  >
                    Baca <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Filter Category */}
      <section className="mb-12 sticky top-20 z-20 bg-canvas-dark/95 backdrop-blur-md py-4 border-b border-hairline-dark">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar w-full md:w-auto gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 font-jetbrains text-mono-button rounded-none border transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-hairline-dark hover:border-muted-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="w-full md:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-card-dark border border-hairline-dark rounded-none pl-10 pr-4 py-2 font-jetbrains text-sm focus:border-cyber-blue focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {gridArticles.map((article, index) => (
            <motion.div
              key={article.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              className="group bg-surface-card-dark border border-hairline-dark rounded-sm overflow-hidden hover:shadow-[0_0_12px_rgba(0,102,177,0.15)] hover:border-cyber-blue/50 transition-all duration-300 flex flex-col"
            >
              <Link
                href={`/artikel/${article.slug}`}
                className="flex-1 flex flex-col"
              >
                <div className="relative aspect-video bg-canvas-dark overflow-hidden">
                  {article.cover_image_url ? (
                    <Image
                      src={article.cover_image_url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-linear-to-tr from-surface-card-dark to-tech-navy/20 z-0"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:scale-105 transition-transform duration-700">
                        <span className="font-jetbrains text-xl text-foreground">
                          ROBOTIK
                        </span>
                      </div>
                    </>
                  )}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      className={`inline-block px-2 py-1 text-[10px] font-jetbrains uppercase text-white rounded-sm ${
                        article.category === "Tutorial"
                          ? "bg-green-600"
                          : article.category === "Kompetisi"
                            ? "bg-crimson-red"
                            : article.category === "Riset & Teknologi"
                              ? "bg-tech-navy"
                              : "bg-cyber-blue"
                      }`}
                    >
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-display-sm font-bold text-foreground leading-tight line-clamp-2 mb-3 group-hover:text-cyber-blue transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-body-md text-muted-foreground line-clamp-2 flex-1">
                    {article.excerpt}
                  </p>

                  <div className="mt-6 pt-4 border-t border-hairline-dark flex items-center justify-between text-xs font-jetbrains text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-cyber-blue/20 flex items-center justify-center text-cyber-blue">
                        {article.profiles?.email?.charAt(0).toUpperCase() ||
                          "A"}
                      </div>
                      <span className="truncate max-w-[100px]">
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

      {filteredArticles.length === 0 && (
        <div className="text-center py-24">
          <p className="font-jetbrains text-muted-foreground">
            Tidak ada artikel yang cocok dengan pencarian.
          </p>
        </div>
      )}
    </div>
  );
}
