"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Image01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  reviewPiketLog,
  imposePiketFine,
  markPiketFinePaid,
  voidPiketFine,
} from "@/lib/actions/piket";
import { getPiketWeekInfo } from "@/lib/utils/piket-date";
import { getPublicR2Url } from "@/lib/storage/r2";
import { getPiketLogStatus } from "./types";
import type { PiketFine, PiketLog, PiketProfile, PiketSchedule } from "./types";
import {
  PiketLogStatusBadge,
  PiketComplianceBadge,
} from "./piket-status-badge";
import { PiketPhotoPreviewDialog } from "./piket-photo-preview-dialog";
import type { PiketComplianceRow } from "@/lib/repositories/piket";

export interface PiketVerificationClientProps {
  profile: PiketProfile;
  availablePeriods: string[];
  logs: PiketLog[];
  fines: PiketFine[];
  schedules: PiketSchedule[];
  compliance: PiketComplianceRow[];
}

export function PiketVerificationClient({
  profile,
  availablePeriods,
  logs,
  fines,
  schedules,
  compliance,
}: PiketVerificationClientProps) {
  const router = useRouter();

  // Get current ISO cross-month week info
  const weekInfo = getPiketWeekInfo(new Date());

  // Active section tab + period state
  const [activeSection, setActiveSection] = useState<
    "verifikasi" | "kepatuhan"
  >("verifikasi");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    availablePeriods[0] || "2026/2027",
  );

  // Filter logs and fines by selected period
  const periodLogs = logs.filter(
    (l) => !l.academic_period || l.academic_period === selectedPeriod,
  );

  // Image Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    beforeUrl: string | null;
    afterUrl: string | null;
    reporterName: string;
    dutyDate: string;
    activeTab: "before" | "after";
  } | null>(null);

  // Review (kestari) states
  const [reviewDialog, setReviewDialog] = useState<{
    logId: string;
    decision: "approve" | "reject";
  } | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  // Fine (denda) dialog states
  const [fineDialog, setFineDialog] = useState<{
    reporterId: string;
    reporterName: string;
    scheduleId: string;
    weekNumber: number;
  } | null>(null);
  const [fineAmount, setFineAmount] = useState("10000");
  const [fineNotes, setFineNotes] = useState("");
  const [isFining, setIsFining] = useState(false);

  const formatRp = (n: number) => `Rp${Number(n).toLocaleString("id-ID")}`;

  // Jumlah laporan auto-terverifikasi yang belum direview manusia (badge kestari)
  const pendingReviewCount = periodLogs.filter(
    (l) => getPiketLogStatus(l) === "pending",
  ).length;

  const periodUnpaidFines = fines.filter(
    (f) =>
      f.status !== "lunas" &&
      (!f.academic_period || f.academic_period === selectedPeriod),
  );

  // Kepatuhan rows for selected period + quick-count summary
  const periodCompliance = compliance.filter(
    (r) => r.academicPeriod === selectedPeriod,
  );
  const complianceCounts = {
    alpha: periodCompliance.filter((r) => r.status === "alpha").length,
    berlangsung: periodCompliance.filter((r) => r.status === "berlangsung")
      .length,
    magang: periodCompliance.filter((r) => r.status === "magang").length,
    sudahLapor: periodCompliance.filter((r) => r.status === "sudah-lapor")
      .length,
  };

  // Kestari: setujui / tolak laporan
  const handleReviewConfirm = async () => {
    if (!reviewDialog) return;
    if (reviewDialog.decision === "reject" && !reviewReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }

    setIsReviewing(true);
    const loadToast = toast.loading("Menyimpan hasil review...");

    try {
      const res = await reviewPiketLog(
        reviewDialog.logId,
        reviewDialog.decision,
        reviewReason,
      );
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setReviewDialog(null);
        setReviewReason("");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menyimpan review.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsReviewing(false);
    }
  };

  // Kestari: kenakan denda administratif
  const handleImposeFineConfirm = async () => {
    if (!fineDialog) return;
    const amount = Math.floor(Number(fineAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Nominal denda tidak valid.");
      return;
    }

    setIsFining(true);
    const loadToast = toast.loading("Mencatat denda piket...");

    try {
      const res = await imposePiketFine(
        fineDialog.reporterId,
        fineDialog.scheduleId,
        amount,
        fineNotes,
      );
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setFineDialog(null);
        setFineAmount("10000");
        setFineNotes("");
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mencatat denda.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setIsFining(false);
    }
  };

  // Kestari: tandai lunas / batalkan denda
  const handleMarkPaid = async (fineId: string) => {
    setRowBusy(fineId);
    const loadToast = toast.loading("Menandai pelunasan denda...");

    try {
      const res = await markPiketFinePaid(fineId);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menandai pelunasan.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setRowBusy(null);
    }
  };

  const handleVoidFine = async (fineId: string) => {
    setRowBusy(fineId);
    const loadToast = toast.loading("Membatalkan denda...");

    try {
      const res = await voidPiketFine(fineId);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal membatalkan denda.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan sistem: " + errMsg);
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Header Panel - Mobile First & Precision Blueprint Style */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        {/* Tricolor Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#0a192f] dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={24}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Piket Kebersihan Kesekretariatan &amp; Workshop
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Verifikasi laporan &amp; kelola denda piket DPH UKM Robotik PNP —
              masuk sebagai {profile.email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#ffedd5] dark:bg-orange-950/60 text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
              SAAT INI: PEKAN {weekInfo.weekNumber} (
              {weekInfo.dateRangeFormatted})
            </Badge>

            {pendingReviewCount > 0 && (
              <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
                {pendingReviewCount} MENUNGGU REVIEW
              </Badge>
            )}

            {periodUnpaidFines.length > 0 && (
              <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold">
                {periodUnpaidFines.length} DENDA BELUM LUNAS
              </Badge>
            )}

            <Link href="/piket/kelola">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-700 font-mono text-xs text-[#1e3a8a] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <HugeiconsIcon
                  icon={Settings02Icon}
                  size={15}
                  className="mr-1.5"
                />
                Kelola Penjadwalan &amp; Periode
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Period Selection Dropdown Bar */}
      {availablePeriods.length > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-xs">
          <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Periode DPH Akademik:
          </span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-[#0a192f] dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
          >
            {availablePeriods.map((p) => (
              <option key={p} value={p}>
                Periode DPH {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Section Tab Switcher: Verifikasi & Denda vs Kepatuhan */}
      <div className="flex gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection("verifikasi")}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center ${
            activeSection === "verifikasi"
              ? "bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          Verifikasi &amp; Denda
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("kepatuhan")}
          className={`flex-1 py-2 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center ${
            activeSection === "kepatuhan"
              ? "bg-[#1e3a8a] dark:bg-blue-600 text-white shadow-xs"
              : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          Kepatuhan
        </button>
      </div>

      {/* Kepatuhan panel (kept mounted; hidden via CSS when inactive) */}
      <div className={activeSection === "kepatuhan" ? "block" : "hidden"}>
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Rekap Status Piket DPH ({selectedPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Ringkasan status piket seluruh anggota per pekan pada periode{" "}
              {selectedPeriod}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Quick-count summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-700 dark:text-red-300 block">
                  Alpha
                </span>
                <span className="font-display font-medium text-lg text-red-700 dark:text-red-300">
                  {complianceCounts.alpha}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-300 block">
                  Berlangsung
                </span>
                <span className="font-display font-medium text-lg text-amber-700 dark:text-amber-300">
                  {complianceCounts.berlangsung}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300 block">
                  Magang
                </span>
                <span className="font-display font-medium text-lg text-slate-600 dark:text-slate-300">
                  {complianceCounts.magang}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-300 block">
                  Sudah Lapor
                </span>
                <span className="font-display font-medium text-lg text-emerald-700 dark:text-emerald-300">
                  {complianceCounts.sudahLapor}
                </span>
              </div>
            </div>

            {periodCompliance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Belum ada data piket untuk periode {selectedPeriod}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="p-3">Anggota</th>
                      <th className="p-3">NIM</th>
                      <th className="p-3">Pekan</th>
                      <th className="p-3">Ruang</th>
                      <th className="p-3">Rentang</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {periodCompliance.map((r) => (
                      <tr
                        key={`${r.profileId}-${r.weekNumber}-${r.roomTarget}-${r.startIsoDate}`}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                            {r.memberName}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {r.nim || "-"}
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          Pekan {r.weekNumber}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {r.roomTarget}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {new Date(r.startIsoDate).toLocaleDateString(
                            "id-ID",
                            {
                              dateStyle: "medium",
                            },
                          )}
                          {" – "}
                          {new Date(r.endIsoDate).toLocaleDateString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </td>
                        <td className="p-3">
                          <PiketComplianceBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verifikasi & Denda panel (kept mounted; hidden via CSS when inactive) */}
      <div
        className={
          activeSection === "verifikasi" ? "block space-y-6" : "hidden"
        }
      >
        {/* Section: Log History */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Riwayat Log Piket Kebersihan ({selectedPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Daftar lengkap laporan piket kebersihan ruang kesekretariatan
              &amp; workshop DPH.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {periodLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Belum ada riwayat piket yang tercatat untuk periode{" "}
                {selectedPeriod}.
              </div>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-3">
                  {periodLogs.map((log) => {
                    const status = getPiketLogStatus(log);
                    return (
                      <div
                        key={log.id}
                        className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 block">
                              {log.reporter_name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {log.reporter_nim || "-"}
                            </span>
                          </div>
                          <PiketLogStatusBadge status={status} />
                        </div>

                        {(log.photo_taken_at_before ||
                          log.photo_taken_at_after) && (
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Foto diambil:{" "}
                            {log.photo_taken_at_before
                              ? new Date(
                                  log.photo_taken_at_before,
                                ).toLocaleDateString("id-ID", {
                                  dateStyle: "medium",
                                })
                              : "-"}
                            {" → "}
                            {log.photo_taken_at_after
                              ? new Date(
                                  log.photo_taken_at_after,
                                ).toLocaleDateString("id-ID", {
                                  dateStyle: "medium",
                                })
                              : "-"}
                          </p>
                        )}

                        {status === "rejected" && log.rejection_reason && (
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs">
                            <p className="font-semibold text-red-700 dark:text-red-300 font-mono text-[10px] uppercase">
                              Alasan penolakan
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 font-body mt-0.5">
                              {log.rejection_reason}
                            </p>
                          </div>
                        )}

                        {status === "approved" && log.verifier_name && (
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Disetujui oleh: {log.verifier_name}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              TANGGAL TUGAS
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {new Date(log.duty_date).toLocaleDateString(
                                "id-ID",
                                {
                                  dateStyle: "medium",
                                },
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              ({log.schedule_day})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              DOKUMENTASI
                            </span>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {log.proof_image_before_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewModal({
                                      beforeUrl: getPublicR2Url(
                                        log.proof_image_before_url,
                                      ),
                                      afterUrl: getPublicR2Url(
                                        log.proof_image_url,
                                      ),
                                      reporterName: log.reporter_name,
                                      dutyDate: new Date(
                                        log.duty_date,
                                      ).toLocaleDateString("id-ID", {
                                        dateStyle: "medium",
                                      }),
                                      activeTab: "before",
                                    });
                                  }}
                                  className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[10px] uppercase h-7 px-2"
                                >
                                  <HugeiconsIcon
                                    icon={Image01Icon}
                                    size={12}
                                    className="mr-1"
                                  />
                                  Sebelum
                                </Button>
                              )}
                              {log.proof_image_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewModal({
                                      beforeUrl: getPublicR2Url(
                                        log.proof_image_before_url,
                                      ),
                                      afterUrl: getPublicR2Url(
                                        log.proof_image_url,
                                      ),
                                      reporterName: log.reporter_name,
                                      dutyDate: new Date(
                                        log.duty_date,
                                      ).toLocaleDateString("id-ID", {
                                        dateStyle: "medium",
                                      }),
                                      activeTab: "after",
                                    });
                                  }}
                                  className="border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2"
                                >
                                  <HugeiconsIcon
                                    icon={Image01Icon}
                                    size={12}
                                    className="mr-1"
                                  />
                                  Sesudah
                                </Button>
                              )}
                              {!log.proof_image_before_url &&
                                !log.proof_image_url && (
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    -
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-body border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                            {log.notes}
                          </p>
                        )}

                        {status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              disabled={isReviewing || rowBusy === log.id}
                              onClick={() => {
                                setReviewReason("");
                                setReviewDialog({
                                  logId: log.id,
                                  decision: "approve",
                                });
                              }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase h-8 cursor-pointer"
                            >
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                size={13}
                                className="mr-1"
                              />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isReviewing || rowBusy === log.id}
                              onClick={() => {
                                setReviewReason("");
                                setReviewDialog({
                                  logId: log.id,
                                  decision: "reject",
                                });
                              }}
                              className="flex-1 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase h-8 cursor-pointer"
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                size={13}
                                className="mr-1"
                              />
                              Tolak
                            </Button>
                          </div>
                        )}

                        {status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rowBusy === log.id}
                            onClick={() =>
                              setFineDialog({
                                reporterId: log.reporter_id,
                                reporterName: log.reporter_name,
                                scheduleId: log.schedule_id,
                                weekNumber:
                                  schedules.find(
                                    (s) => s.id === log.schedule_id,
                                  )?.week_number ?? 0,
                              })
                            }
                            className="w-full border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase h-8 cursor-pointer"
                          >
                            Kenakan Denda
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        <th className="p-3">Tanggal Tugas</th>
                        <th className="p-3">Petugas</th>
                        <th className="p-3">Jadwal Pekan</th>
                        <th className="p-3">Verifikasi</th>
                        <th className="p-3">Foto Bukti</th>
                        <th className="p-3">Catatan</th>
                        <th className="p-3">Aksi Kestari</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {periodLogs.map((log) => {
                        const status = getPiketLogStatus(log);
                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                              {new Date(log.duty_date).toLocaleDateString(
                                "id-ID",
                                {
                                  dateStyle: "medium",
                                },
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-display font-medium text-[#0a192f] dark:text-slate-100 block">
                                {log.reporter_name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                {log.reporter_nim || "-"}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                              {log.schedule_day}
                              {(log.photo_taken_at_before ||
                                log.photo_taken_at_after) && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                  Foto:{" "}
                                  {log.photo_taken_at_before
                                    ? new Date(
                                        log.photo_taken_at_before,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })
                                    : "-"}
                                  {" → "}
                                  {log.photo_taken_at_after
                                    ? new Date(
                                        log.photo_taken_at_after,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                      })
                                    : "-"}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <PiketLogStatusBadge status={status} />
                              {status === "rejected" &&
                                log.rejection_reason && (
                                  <span
                                    className="text-[10px] text-red-600 dark:text-red-400 block max-w-[180px] truncate mt-1"
                                    title={log.rejection_reason}
                                  >
                                    {log.rejection_reason}
                                  </span>
                                )}
                              {status === "approved" && log.verifier_name && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                                  oleh {log.verifier_name}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {log.proof_image_before_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPreviewModal({
                                        beforeUrl: getPublicR2Url(
                                          log.proof_image_before_url,
                                        ),
                                        afterUrl: getPublicR2Url(
                                          log.proof_image_url,
                                        ),
                                        reporterName: log.reporter_name,
                                        dutyDate: new Date(
                                          log.duty_date,
                                        ).toLocaleDateString("id-ID", {
                                          dateStyle: "medium",
                                        }),
                                        activeTab: "before",
                                      });
                                    }}
                                    className="border-slate-200 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 font-mono text-[10px] uppercase h-7 px-2"
                                  >
                                    <HugeiconsIcon
                                      icon={Image01Icon}
                                      size={12}
                                      className="mr-1"
                                    />
                                    Sebelum
                                  </Button>
                                )}
                                {log.proof_image_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setPreviewModal({
                                        beforeUrl: getPublicR2Url(
                                          log.proof_image_before_url,
                                        ),
                                        afterUrl: getPublicR2Url(
                                          log.proof_image_url,
                                        ),
                                        reporterName: log.reporter_name,
                                        dutyDate: new Date(
                                          log.duty_date,
                                        ).toLocaleDateString("id-ID", {
                                          dateStyle: "medium",
                                        }),
                                        activeTab: "after",
                                      });
                                    }}
                                    className="border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2"
                                  >
                                    <HugeiconsIcon
                                      icon={Image01Icon}
                                      size={12}
                                      className="mr-1"
                                    />
                                    Sesudah
                                  </Button>
                                )}
                                {!log.proof_image_before_url &&
                                  !log.proof_image_url && (
                                    <span className="text-slate-400 font-mono">
                                      -
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td
                              className="p-3 text-slate-600 dark:text-slate-400 max-w-[220px] truncate"
                              title={log.notes || ""}
                            >
                              {log.notes || "-"}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1.5 min-w-[130px]">
                                {status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        isReviewing || rowBusy === log.id
                                      }
                                      onClick={() => {
                                        setReviewReason("");
                                        setReviewDialog({
                                          logId: log.id,
                                          decision: "approve",
                                        });
                                      }}
                                      className="border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                                    >
                                      Setujui
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        isReviewing || rowBusy === log.id
                                      }
                                      onClick={() => {
                                        setReviewReason("");
                                        setReviewDialog({
                                          logId: log.id,
                                          decision: "reject",
                                        });
                                      }}
                                      className="border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                                    >
                                      Tolak
                                    </Button>
                                  </>
                                )}
                                {status === "rejected" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={rowBusy === log.id}
                                    onClick={() =>
                                      setFineDialog({
                                        reporterId: log.reporter_id,
                                        reporterName: log.reporter_name,
                                        scheduleId: log.schedule_id,
                                        weekNumber:
                                          schedules.find(
                                            (s) => s.id === log.schedule_id,
                                          )?.week_number ?? 0,
                                      })
                                    }
                                    className="border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                                  >
                                    Kenakan Denda
                                  </Button>
                                )}
                                {(status === "approved" ||
                                  status === "auto_final") && (
                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    Final
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section: Denda Administratif */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Denda Administratif Piket ({selectedPeriod})
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Kelola denda anggota: kenakan dari laporan yang ditolak, tandai
              lunas, atau batalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {fines.filter(
              (f) => !f.academic_period || f.academic_period === selectedPeriod,
            ).length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Tidak ada denda piket pada periode {selectedPeriod}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {fines
                  .filter(
                    (f) =>
                      !f.academic_period ||
                      f.academic_period === selectedPeriod,
                  )
                  .map((fine) => (
                    <div
                      key={fine.id}
                      className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-display font-medium text-sm text-[#0a192f] dark:text-slate-100 block truncate">
                          {fine.member_name}
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                            {fine.member_nim || "-"}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Pekan {fine.week_number} • {formatRp(fine.amount)}
                          {fine.notes ? ` • ${fine.notes}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {fine.status === "lunas" ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] rounded-full">
                            LUNAS
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10px] rounded-full">
                            BELUM LUNAS
                          </Badge>
                        )}
                        {fine.status !== "lunas" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={rowBusy === fine.id}
                            onClick={() => handleMarkPaid(fine.id)}
                            className="border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                          >
                            Tandai Lunas
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rowBusy === fine.id}
                          onClick={() => handleVoidFine(fine.id)}
                          className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase h-7 px-2 cursor-pointer"
                        >
                          Batalkan
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Review laporan (Setujui / Tolak) */}
      <Dialog
        open={!!reviewDialog}
        onOpenChange={(open) => !open && setReviewDialog(null)}
      >
        <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              {reviewDialog?.decision === "approve"
                ? "Setujui Laporan Piket"
                : "Tolak Laporan Piket"}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {reviewDialog?.decision === "approve"
                ? "Laporan yang disetujui bersifat final dan tidak dapat diubah lagi."
                : "Laporan yang ditolak dapat diunggah ulang oleh anggota sebagai log baru (maks 2x per pekan)."}
            </DialogDescription>
          </DialogHeader>

          {reviewDialog?.decision === "reject" && (
            <div className="space-y-1.5 my-2">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Alasan Penolakan (wajib)
              </Label>
              <Textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Contoh: Foto bukan kondisi ruangan yang dibersihkan..."
                className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs min-h-[80px] font-body"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewDialog(null)}
              className="text-xs font-mono"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={
                isReviewing ||
                (reviewDialog?.decision === "reject" && !reviewReason.trim())
              }
              onClick={handleReviewConfirm}
              className={
                reviewDialog?.decision === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono"
                  : "bg-red-600 hover:bg-red-700 text-white text-xs font-mono"
              }
            >
              {isReviewing
                ? "Menyimpan..."
                : reviewDialog?.decision === "approve"
                  ? "Ya, Setujui"
                  : "Ya, Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Kenakan denda */}
      <Dialog
        open={!!fineDialog}
        onOpenChange={(open) => !open && setFineDialog(null)}
      >
        <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100">
              Kenakan Denda Piket
            </DialogTitle>
            <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {fineDialog?.reporterName} • Pekan {fineDialog?.weekNumber} (
              {selectedPeriod})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nominal (Rp)
              </Label>
              <input
                type="number"
                min={1}
                step={500}
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-[#0a192f] dark:text-slate-100 font-mono outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Keterangan (opsional)
              </Label>
              <Textarea
                value={fineNotes}
                onChange={(e) => setFineNotes(e.target.value)}
                placeholder="Contoh: Laporan ditolak 2x tanpa perbaikan..."
                className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-lg text-xs min-h-[64px] font-body"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFineDialog(null)}
              className="text-xs font-mono"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isFining}
              onClick={handleImposeFineConfirm}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono"
            >
              {isFining ? "Menyimpan..." : "Kenakan Denda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <PiketPhotoPreviewDialog
        open={!!previewModal}
        beforeUrl={previewModal?.beforeUrl ?? null}
        afterUrl={previewModal?.afterUrl ?? null}
        reporterName={previewModal?.reporterName ?? "Anggota"}
        dutyDate={previewModal?.dutyDate ?? ""}
        activeTab={previewModal?.activeTab ?? "before"}
        onTabChange={(tab) =>
          setPreviewModal((prev) => (prev ? { ...prev, activeTab: tab } : null))
        }
        onClose={() => setPreviewModal(null)}
      />
    </div>
  );
}
