"use client";

import { motion } from "framer-motion";
import { CaangDashboardStats } from "@/lib/actions/caang-stats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChartsViewProps {
  stats: CaangDashboardStats;
}

export function CaangChartsView({ stats }: ChartsViewProps) {
  const maxDailyCount = Math.max(
    ...stats.dailyTrend.map((d) => d.total),
    1,
  );

  const maxProgCount = Math.max(
    ...stats.studyProgramDistribution.map((p) => p.count),
    1,
  );

  return (
    <div className="space-y-6">
      {/* 1. Grafik Tren Pendaftaran per Hari */}
      <Card className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-sm font-display font-semibold text-foreground">
                Tren Pendaftaran Caang per Hari
              </CardTitle>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                Jumlah pembuatan akun dan submit form per tanggal pendaftaran.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
              {stats.dailyTrend.length} Hari Terdaftar
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {stats.dailyTrend.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-xs">
              Belum ada data pendaftaran pada periode ini.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom SVG Bar Chart / Visualizer */}
              <div className="flex items-end gap-2 sm:gap-3 h-48 pt-6 pb-2 px-2 overflow-x-auto border-b border-border">
                {stats.dailyTrend.map((item) => {
                  const barHeightPct = Math.round((item.total / maxDailyCount) * 100);
                  return (
                    <div
                      key={item.date}
                      className="flex-1 min-w-[32px] sm:min-w-[40px] flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-mono px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {item.formattedDate}: {item.total} Caang
                      </div>

                      {/* Number on top of bar */}
                      <span className="text-[10px] font-mono font-bold text-foreground opacity-80 group-hover:opacity-100">
                        {item.total}
                      </span>

                      {/* Bar Fill */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(barHeightPct, 6)}%` }}
                        transition={{ duration: 0.4 }}
                        className="w-full bg-primary/80 group-hover:bg-primary rounded-t-md transition-colors relative"
                      >
                        {/* Sub-bar for Verified */}
                        {item.verified > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-sm"
                            style={{
                              height: `${Math.round((item.verified / item.total) * 100)}%`,
                            }}
                          />
                        )}
                      </motion.div>

                      {/* Date label */}
                      <span className="text-[9px] font-mono text-muted-foreground group-hover:text-foreground truncate max-w-full">
                        {item.formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-primary" />
                  <span>Total Pendaftar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-emerald-500" />
                  <span>Verified (Lolos)</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid Row 2: Status Breakdown & Study Program Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="bg-card border border-border rounded-2xl shadow-xs">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-display font-semibold text-foreground">
              Distribusi Status Pendaftaran
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              Rincian tahapan dokumen Caang.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.statusDistribution.map((st) => {
              const pct =
                stats.summary.totalCaang > 0
                  ? Math.round((st.count / stats.summary.totalCaang) * 100)
                  : 0;

              return (
                <div key={st.status} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-foreground font-medium flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: st.color }}
                      />
                      {st.label}
                    </span>
                    <span className="text-muted-foreground">
                      {st.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Study Program Distribution */}
        <Card className="bg-card border border-border rounded-2xl shadow-xs lg:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-display font-semibold text-foreground">
              Distribusi Program Studi (Top Prodi)
            </CardTitle>
            <CardDescription className="text-xs font-mono text-muted-foreground">
              Program studi pendaftar Caang UKM Robotik PNP.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.studyProgramDistribution.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground font-mono text-xs">
                Belum ada data program studi.
              </div>
            ) : (
              stats.studyProgramDistribution.slice(0, 7).map((prog) => {
                const pct = Math.round((prog.count / maxProgCount) * 100);
                return (
                  <div key={prog.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-foreground font-medium truncate max-w-[280px] sm:max-w-[400px]">
                        <span className="text-primary font-bold">[{prog.degree}]</span>{" "}
                        {prog.name}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {prog.count} Pendaftar
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid Row 3: Gender, Entry Year & Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <Card className="bg-card border border-border rounded-2xl shadow-xs">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-display font-semibold text-foreground">
              Demografi Gender
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.genderDistribution.map((g) => (
              <div
                key={g.gender}
                className="p-3 rounded-xl bg-surface/80 border border-border flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-display font-semibold text-foreground block">
                    {g.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {g.count} Orang
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-xs text-primary border-primary/20 bg-primary-soft"
                >
                  {g.percentage}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Entry Year Distribution */}
        <Card className="bg-card border border-border rounded-2xl shadow-xs">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-display font-semibold text-foreground">
              Angkatan Kuliah
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.entryYearDistribution.map((ey) => (
              <div
                key={ey.year}
                className="p-3 rounded-xl bg-surface/80 border border-border flex items-center justify-between"
              >
                <span className="text-xs font-mono font-bold text-foreground">
                  Angkatan {ey.year}
                </span>
                <span className="text-xs font-mono font-bold text-accent-deep">
                  {ey.count} Pendaftar
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Method Distribution */}
        <Card className="bg-card border border-border rounded-2xl shadow-xs">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-display font-semibold text-foreground">
              Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats.paymentMethodDistribution.map((pm) => (
              <div
                key={pm.method}
                className="p-3 rounded-xl bg-surface/80 border border-border flex items-center justify-between"
              >
                <span className="text-xs font-mono uppercase text-foreground">
                  {pm.method}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {pm.count} Caang
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
