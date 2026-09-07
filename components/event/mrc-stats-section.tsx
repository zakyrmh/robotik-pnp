"use client";

import { Trophy, School, MapPin, Award } from "lucide-react";
import type { PublicEventStats } from "@/lib/actions/event-public";

interface MrcStatsSectionProps {
  stats: PublicEventStats;
}

export function MrcStatsSection({ stats }: MrcStatsSectionProps) {
  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-foreground bg-accent px-3 py-1 rounded-full border border-accent-strong/20">
          Statistik Agregat Publik
        </span>
        <h2 className="font-display font-bold text-balance">
          Antusiasme Peserta Minangkabau Robot Contest
        </h2>
        <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Data statistik partisipasi sekolah, perguruan tinggi, dan perwakilan
          daerah secara real-time.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card shadow-2xs">
          <div className="size-12 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Trophy className="size-6 text-accent-strong" />
          </div>
          <div>
            <p className="font-mono text-2xl font-extrabold text-foreground tracking-tight">
              {stats.totalTeams}
            </p>
            <p className="font-body text-xs text-muted-foreground font-medium">
              Total Tim Terdaftar
            </p>
          </div>
        </div>

        {/* Metric 2: Total Instansi */}
        <div className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card shadow-2xs">
          <div className="size-12 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <School className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-mono text-2xl font-extrabold text-foreground tracking-tight">
              {stats.totalInstitutions}
            </p>
            <p className="font-body text-xs text-muted-foreground font-medium">
              Sekolah & Kampus
            </p>
          </div>
        </div>

        {/* Metric 3: Total Kota/Kabupaten */}
        <div className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card shadow-2xs">
          <div className="size-12 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <MapPin className="size-6 text-success" />
          </div>
          <div>
            <p className="font-mono text-2xl font-extrabold text-foreground tracking-tight">
              {stats.totalCities}
            </p>
            <p className="font-body text-xs text-muted-foreground font-medium">
              Kabupaten / Kota
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Participating Institutions */}
      {stats.topInstitutions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <h3 className="font-display font-semibold text-sm sm:text-base text-foreground">
                Instansi Berpartisipasi Terbanyak
              </h3>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Top 5
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topInstitutions.map((inst, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-primary bg-primary-soft/80 dark:bg-primary-soft/30 size-6 rounded-full flex items-center justify-center border border-primary/20">
                    {index + 1}
                  </span>
                  <span className="font-body text-xs sm:text-sm font-medium text-foreground">
                    {inst.name}
                  </span>
                </div>

                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-background border border-border text-foreground">
                  {inst.count} Tim
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
