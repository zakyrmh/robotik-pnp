"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Bot,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import type { PublicCategoryWithQuota } from "@/lib/actions/event-public";
import {
  getActiveBatch,
  getCategoryBatchFee,
  BATCH_LABELS,
} from "@/lib/event-batch";
import type {
  EventSettings,
  RegistrationBatch,
} from "@/types/event-registration";
import { cn } from "@/lib/utils";

interface MrcCategoryGridProps {
  categories: PublicCategoryWithQuota[];
  settings?: EventSettings | null;
}

function formatRupiah(amount: number) {
  if (amount === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MrcCategoryGrid({
  categories,
  settings,
}: MrcCategoryGridProps) {
  const [now] = useState(() => Date.now());
  const activeBatch: RegistrationBatch | null = useMemo(
    () => getActiveBatch(settings, new Date(now)),
    [settings, now],
  );

  /**
   * Biaya Batch 2 disembunyikan sampai pendaftaran Batch 2 dibuka
   * (param `batch2_start` terlewati). Tanpa jadwal, tampilkan seperti biasa.
   */
  const batch2Revealed = useMemo(() => {
    if (!settings?.batch2_start) return true;
    const start = Date.parse(settings.batch2_start);
    if (Number.isNaN(start)) return true;
    return now >= start;
  }, [settings, now]);

  return (
    <section id="kategori" className="space-y-6">
      {/* Section Title & Subtitle */}
      <div className="text-center space-y-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary bg-primary-soft/50 dark:bg-primary-soft/20 px-3 py-1 rounded-full border border-primary/20">
          Cabang Perlombaan
          {activeBatch ? ` • ${BATCH_LABELS[activeBatch]}` : ""}
        </span>
        <h2 className="font-display font-bold text-balance">
          Pilih Kategori Lomba Tim Anda
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-xl mx-auto">
          {activeBatch
            ? `Pendaftaran ${BATCH_LABELS[activeBatch]} sedang dibuka. Pastikan tim Anda mendaftar sebelum kuota habis.`
            : "Pendaftaran sedang ditutup (di luar periode Batch 1 / Batch 2). Pantau jadwal pembukaan berikutnya."}
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const isFull = cat.remaining_quota === 0;
          const isWarning = cat.remaining_quota <= 5 && cat.remaining_quota > 0;
          const registrationOpen = activeBatch !== null;
          const canRegister = cat.is_active && !isFull && registrationOpen;

          const feeBatch1 = getCategoryBatchFee(cat, "batch1");
          const feeBatch2 = getCategoryBatchFee(cat, "batch2");
          const activeFee = activeBatch
            ? getCategoryBatchFee(cat, activeBatch)
            : null;

          return (
            <div
              key={cat.id}
              className={cn(
                "flex flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-soft",
                isFull && "opacity-85 bg-muted/30",
              )}
            >
              <div className="space-y-4">
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between gap-2">
                  <div className="size-10 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary">
                    <Bot className="size-5" />
                  </div>

                  {/* Quota Status Badge */}
                  {isFull ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                      <XCircle className="size-3.5" />
                      <span>Kuota Penuh</span>
                    </span>
                  ) : isWarning ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/30">
                      <AlertTriangle className="size-3.5" />
                      <span>Sisa {cat.remaining_quota} Slot Lagi!</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                      <CheckCircle2 className="size-3.5" />
                      <span>Tersedia ({cat.remaining_quota} Slot)</span>
                    </span>
                  )}
                </div>

                {/* Category Title & Description */}
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground transition-colors">
                    {cat.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                    {cat.description ||
                      "Perlombaan keahlian dan efisiensi desain robotik."}
                  </p>
                </div>

                {/* Details Meta (Batch Fees & Max Members) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  {activeFee !== null && activeBatch ? (
                    <>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">
                          Biaya ({BATCH_LABELS[activeBatch]}):
                        </span>
                        <span className="font-mono font-bold text-sm text-primary">
                          {formatRupiah(activeFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-muted-foreground">
                          {activeBatch === "batch1" ? "Batch 2" : "Batch 1"}:
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {activeBatch === "batch1" && !batch2Revealed
                            ? "Diumumkan menyusul"
                            : formatRupiah(
                                activeBatch === "batch1"
                                  ? feeBatch2
                                  : feeBatch1,
                              )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">
                          Biaya Batch 1:
                        </span>
                        <span className="font-mono font-bold text-sm text-success">
                          {formatRupiah(feeBatch1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">
                          Biaya Batch 2:
                        </span>
                        <span className="font-mono font-bold text-sm text-warning">
                          {batch2Revealed
                            ? formatRupiah(feeBatch2)
                            : "Menyusul"}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">
                      Anggota per Tim:
                    </span>
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Users className="size-3.5 text-muted-foreground" />
                      <span>Maks. {cat.max_team_members} Orang</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-6">
                {canRegister ? (
                  <Link
                    href={`/mrc/${cat.slug}/daftar`}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>Daftar {cat.name}</span>
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-medium px-4 py-2.5 rounded-md bg-muted text-muted-foreground cursor-not-allowed border border-border"
                  >
                    <span>Pendaftaran Ditutup</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
