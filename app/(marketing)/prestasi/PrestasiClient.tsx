"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import type { Database } from "@/types/database.types";

type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"];
type DivisionRow = Database["public"]["Tables"]["divisions"]["Row"];

export type AchievementWithDivision = Pick<
  AchievementRow,
  "id" | "title" | "description" | "year" | "level" | "division_id"
> & {
  divisions: Pick<DivisionRow, "id" | "name" | "slug" | "badge_color"> | null;
};

interface PrestasiClientProps {
  achievements: AchievementWithDivision[];
}

const CATEGORIES = ["Semua", "KRSBI-B", "KRI", "Gemastik", "Lainnya"];

export default function PrestasiClient({ achievements }: PrestasiClientProps) {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("Semua");

  const years = Array.from(
    new Set(achievements.map((a) => a.year.toString()))
  ).sort((a, b) => Number(b) - Number(a));

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear = selectedYear === "Semua" || a.year.toString() === selectedYear;

    let matchesCategory = true;
    if (activeCategory !== "Semua") {
      const isKRSBIB = a.divisions?.slug === "krsbi-b";
      const isKRI = a.level.toLowerCase().includes("kri");
      const isGemastik = a.title.toLowerCase().includes("gemastik") || !!(a.description && a.description.toLowerCase().includes("gemastik"));

      if (activeCategory === "KRSBI-B") matchesCategory = isKRSBIB;
      else if (activeCategory === "KRI") matchesCategory = isKRI;
      else if (activeCategory === "Gemastik") matchesCategory = isGemastik;
      else if (activeCategory === "Lainnya") matchesCategory = !isKRSBIB && !isKRI && !isGemastik;
    }

    return matchesSearch && matchesYear && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 max-w-7xl pb-24">
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <span className="inline-block px-3 py-1 bg-cyber-blue/10 text-cyber-blue font-jetbrains text-mono-eyebrow rounded-sm uppercase tracking-wider">
            Prestasi & Penghargaan
          </span>
          <h1 className="text-display-lg md:text-display-xl font-bold uppercase tracking-tight text-foreground leading-tight">
            Dedikasi, Inovasi, dan Kemenangan untuk Almamater
          </h1>
          <p className="text-body-md text-muted-foreground">
            Rekam jejak perjuangan, kreativitas, dan pencapaian teknologi terbaik dari para talenta muda robotik.
          </p>
        </motion.div>
      </section>

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

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari prestasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-card-dark border border-hairline-dark rounded-none pl-10 pr-4 py-2 font-jetbrains text-sm focus:border-cyber-blue focus:outline-none transition-colors"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-surface-card-dark border border-hairline-dark rounded-none px-4 py-2 font-jetbrains text-sm focus:border-cyber-blue focus:outline-none transition-colors"
            >
              <option value="Semua">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group bg-surface-card-dark border border-hairline-dark rounded-sm overflow-hidden hover:border-cyber-blue hover:shadow-[0_0_12px_rgba(0,102,177,0.2)] transition-all duration-300"
            >
              <div className="relative h-48 bg-canvas-dark overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-canvas-dark to-surface-card-dark/50 z-0"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-105 transition-transform duration-500">
                  <span className="font-jetbrains text-display-md text-foreground">ROBOTIK PNP</span>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <span
                    className="inline-block px-2 py-1 text-xs font-jetbrains font-bold text-white rounded-sm"
                    style={{ backgroundColor: achievement.divisions?.badge_color || "var(--color-cyber-blue)" }}
                  >
                    {achievement.divisions?.slug.toUpperCase() || "UMUM"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="font-jetbrains text-mono-eyebrow text-muted-foreground flex justify-between items-center">
                  <span>{achievement.level}</span>
                  <span>{achievement.year}</span>
                </div>

                <h3 className="text-display-md text-foreground leading-tight line-clamp-2">
                  {achievement.title}
                </h3>

                {achievement.description && (
                  <p className="text-body-md text-muted-foreground line-clamp-3">
                    {achievement.description}
                  </p>
                )}

                <div className="h-[2px] w-full bg-gradient-to-r from-cyber-blue via-tech-navy to-crimson-red mt-4 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-24">
          <p className="font-jetbrains text-muted-foreground">Tidak ada prestasi yang cocok dengan filter.</p>
        </div>
      )}
    </div>
  );
}
