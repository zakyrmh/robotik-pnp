"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, Calendar, Award } from "lucide-react";
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

export default function PrestasiClient({ achievements }: PrestasiClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("Semua");

  const years = Array.from(
    new Set(achievements.map((a) => a.year.toString())),
  ).sort((a, b) => Number(b) - Number(a));

  const filteredAchievements = achievements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description &&
        a.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear =
      selectedYear === "Semua" || a.year.toString() === selectedYear;

    return matchesSearch && matchesYear;
  });

  return (
    <div className="container mx-auto px-4 max-w-7xl pb-24">
      {/* Header / Hero Section */}
      <section className="py-12 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-mono text-accent-strong shadow-2xs">
            <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">
              Prestasi & Penghargaan
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight text-balance">
            Dedikasi, Inovasi, dan Kemenangan untuk Almamater
          </h1>

          <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto text-pretty">
            Rekam jejak perjuangan, kreativitas, dan pencapaian teknologi
            terbaik dari para talenta muda robotik.
          </p>
        </motion.div>
      </section>

      {/* Filter & Search Bar */}
      <section className="mb-10 sticky top-20 z-20 bg-background/80 backdrop-blur-md py-4 border-y border-border transition-colors">
        <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between">
          <div className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
            Menampilkan{" "}
            <span className="font-semibold text-foreground font-mono">
              {filteredAchievements.length}
            </span>{" "}
            prestasi
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Cari prestasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 font-body text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[40px]"
              />
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-card border border-border rounded-lg px-3.5 py-2 font-body text-xs sm:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs cursor-pointer min-h-[40px]"
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

      {/* Achievements Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="group bg-card border border-border rounded-xl overflow-hidden shadow-2xs hover:border-primary/50 hover:shadow-soft transition-all duration-200 flex flex-col justify-between relative"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border group-hover:bg-primary transition-colors duration-200 z-10" />

              <div>
                {/* Visual Header Box */}
                <div className="relative h-40 bg-secondary/70 border-b border-border flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-b from-transparent to-card/60 z-0" />

                  {/* Watermark Logo / Icon */}
                  <div className="relative z-0 flex flex-col items-center justify-center opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-300">
                    <Trophy className="size-16 text-primary mb-1" />
                    <span className="font-mono text-xs uppercase tracking-widest text-foreground font-bold">
                      ROBOTIK PNP
                    </span>
                  </div>

                  {/* Division Badge (Top Right) */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className="inline-block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-accent text-accent-foreground dark:bg-accent/20 border border-border shadow-2xs">
                      {achievement.divisions?.slug.toUpperCase() || "UMUM"}
                    </span>
                  </div>

                  {/* Level Badge (Bottom Left) */}
                  <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-md bg-card/90 dark:bg-card/70 border border-border text-foreground shadow-2xs">
                      <Award className="size-3 text-accent-strong" />
                      {achievement.level}
                    </span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-accent-strong">
                      <Calendar className="size-3.5" />
                      {achievement.year}
                    </span>
                    <span className="uppercase tracking-wider">
                      {achievement.divisions?.name || "Tingkat Tim"}
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {achievement.title}
                  </h2>

                  {achievement.description && (
                    <p className="font-body text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {achievement.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-6 pb-5 pt-0">
                <div className="h-0.5 w-full bg-border group-hover:bg-primary/50 transition-colors" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-20 bg-card border border-border rounded-xl p-8 shadow-2xs mt-6">
          <Trophy className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-body text-sm sm:text-base text-muted-foreground">
            Tidak ada prestasi yang cocok dengan filter.
          </p>
        </div>
      )}
    </div>
  );
}
