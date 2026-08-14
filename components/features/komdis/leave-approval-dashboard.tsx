"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import { reviewLeaveRequest } from "@/lib/actions/komdis";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  File01Icon,
  Search01Icon,
  FilterIcon,
  Loading01Icon,
  Image01Icon,
  Time01Icon,
  TickDouble01Icon,
  Alert01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export interface LeaveRequestItem {
  id: string;
  activity_id: string | null;
  profile_id: string | null;
  status: string;
  approval_status: string | null;
  notes: string | null;
  proof_url: string | null;
  points_awarded: number;
  rejection_reason: string | null;
  created_at: string | null;
  profile?: {
    full_name: string | null;
    nim: string | null;
  } | null;
  activity?: {
    title: string;
    start_date: string;
  } | null;
}

interface LeaveApprovalDashboardProps {
  initialRequests: LeaveRequestItem[];
}

export function LeaveApprovalDashboard({
  initialRequests,
}: LeaveApprovalDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<LeaveRequestItem | null>(
    null,
  );
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter requests based on Search & Status Filter
  const filteredRequests = useMemo(() => {
    return initialRequests.filter((req) => {
      const nameMatch = (req.profile?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const nimMatch = (req.profile?.nim || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const activityMatch = (req.activity?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || nimMatch || activityMatch;

      const status = req.approval_status || "pending";
      const matchesFilter = filter === "all" ? true : status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [initialRequests, searchTerm, filter]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const totalRequests = initialRequests.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    initialRequests.forEach((req) => {
      const st = req.approval_status || "pending";
      if (st === "pending") pendingCount++;
      else if (st === "approved") approvedCount++;
      else if (st === "rejected") rejectedCount++;
    });

    return { totalRequests, pendingCount, approvedCount, rejectedCount };
  }, [initialRequests]);

  const handleApprove = (attendanceId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        await reviewLeaveRequest({
          attendanceId,
          approvalStatus: "approved",
          pointsAwarded: 5, // SOP Komdis: 5 Poin untuk Izin/Sakit Diterima
        });
        setSuccessMsg("Permohonan izin berhasil disetujui (5 Poin Sanksi).");
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal menyetujui perizinan",
        );
      }
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectingItem) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        await reviewLeaveRequest({
          attendanceId: rejectingItem.id,
          approvalStatus: "rejected",
          pointsAwarded: 10, // SOP Komdis: 10 Poin untuk Izin Ditolak
          rejectionReason: rejectionReasonInput.trim() || undefined,
        });
        setSuccessMsg(
          "Permohonan izin telah ditolak (Sanksi 10 Poin diterbitkan).",
        );
        setRejectingItem(null);
        setRejectionReasonInput("");
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal menolak perizinan",
        );
      }
    });
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header Banner Section */}
      <div className="space-y-2">
        <div className="h-1.5 w-full bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] rounded-full" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
          <div>
            <span className="font-mono text-[11px] font-semibold text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest block">
              MODUL VERIFIKASI PERIZINAN KOMDIS
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-[#0a192f] dark:text-slate-100">
              ANTREAN VERIFIKASI SURAT IZIN & SAKIT
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Verifikasi permohonan ketidakhadiran anggota aktif dan pengurus
              sesuai SOP Komisi Disiplin.
            </p>
          </div>
        </div>
      </div>

      {/* Global Toast Alert Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-mono text-xs rounded-xl flex items-center gap-2">
          <HugeiconsIcon icon={Alert01Icon} size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-xs rounded-xl flex items-center gap-2">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={18}
            className="shrink-0"
          />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Telemetry Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Antrean */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-[#1e3a8a] dark:border-l-blue-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={UserGroupIcon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                TOTAL ANTREAN
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-[#0a192f] dark:text-slate-100">
                {metrics.totalRequests}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Menunggu Verifikasi */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-amber-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Time01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                MENUNGGU VERIFIKASI
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.pendingCount}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Diterima */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-emerald-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={TickDouble01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                DITERIMA (+5 PTS)
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.approvedCount}
              </CardTitle>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Ditolak */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4 border-l-4 border-l-red-500">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </div>
            <div>
              <CardDescription className="font-mono text-[10px] uppercase text-red-600 dark:text-red-400 tracking-wider">
                DITOLAK (+10 PTS)
              </CardDescription>
              <CardTitle className="font-display text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.rejectedCount}
              </CardTitle>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls & Filter Bar */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-3.5 sm:p-4">
        <CardContent className="p-0 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* Search Bar Input */}
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="CARI NAMA ANGGOTA / NIM / KEGIATAN..."
              className="pl-10 h-10 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#f97316]/20 focus-visible:border-[#f97316] rounded-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
            {(
              [
                { id: "pending", label: "MENUNGGU" },
                { id: "approved", label: "DITERIMA" },
                { id: "rejected", label: "DITOLAK" },
                { id: "all", label: "SEMUA" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap rounded-md ${
                  filter === tab.id
                    ? "bg-[#1e3a8a] dark:bg-blue-600 text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0a192f] dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid Request Items */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-8 sm:p-12 text-center">
          <CardContent className="p-0 space-y-2">
            <HugeiconsIcon
              icon={FilterIcon}
              size={36}
              className="mx-auto text-slate-400 dark:text-slate-600"
            />
            <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Tidak ada antrean perizinan berstatus [{filter.toUpperCase()}].
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((item) => {
            const status = item.approval_status || "pending";
            let borderClass = "border-l-amber-500";
            let badgeClass =
              "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
            let badgeText = "MENUNGGU VERIFIKASI";

            if (status === "approved") {
              borderClass = "border-l-emerald-500";
              badgeClass =
                "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
              badgeText = "DITERIMA (+5 PTS)";
            } else if (status === "rejected") {
              borderClass = "border-l-red-500";
              badgeClass =
                "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800";
              badgeText = "DITOLAK (+10 PTS)";
            }

            return (
              <Card
                key={item.id}
                className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-4 flex flex-col justify-between border-l-4 ${borderClass} overflow-hidden`}
              >
                <CardHeader className="p-0 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                        NIM: {item.profile?.nim || "—"}
                      </span>
                      <CardTitle className="font-display font-bold text-base text-[#0a192f] dark:text-slate-100">
                        {item.profile?.full_name || "Anggota UKM"}
                      </CardTitle>
                    </div>

                    <span
                      className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider rounded-full border shrink-0 ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 uppercase text-[10px]">
                        KEGIATAN:
                      </span>
                      <span className="font-medium text-[#0a192f] dark:text-slate-100 text-right">
                        {item.activity?.title || "Kegiatan Formal"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 uppercase text-[10px]">
                        STATUS PERMOHONAN:
                      </span>
                      <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-mono uppercase px-2 py-0.5">
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 pt-3 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      CATATAN / ALASAN PERIZINAN:
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 leading-relaxed whitespace-pre-wrap">
                      {item.notes || "Tidak ada alasan tertulis."}
                    </p>

                    {item.rejection_reason && (
                      <div className="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-mono text-xs rounded-lg">
                        <span className="font-bold uppercase block text-[10px] text-red-600 dark:text-red-400">
                          ALASAN PENOLAKAN KOMDIS:
                        </span>
                        {item.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Foto Bukti Preview Button */}
                  {item.proof_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedImage(item.proof_url)}
                      className="w-full font-mono text-xs uppercase tracking-wider h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 justify-center"
                    >
                      <HugeiconsIcon
                        icon={Image01Icon}
                        size={15}
                        className="mr-1.5"
                      />
                      Lihat Foto Bukti Surat
                    </Button>
                  )}

                  {/* Operational Action Buttons */}
                  {status === "pending" && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider h-9 rounded-lg justify-center"
                      >
                        {isPending ? (
                          <HugeiconsIcon
                            icon={Loading01Icon}
                            size={15}
                            className="animate-spin mr-1.5"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={CheckmarkCircle01Icon}
                            size={15}
                            className="mr-1.5"
                          />
                        )}
                        Setujui (+5 PTS)
                      </Button>

                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReasonInput("");
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-wider h-9 rounded-lg justify-center"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={15}
                          className="mr-1.5"
                        />
                        Tolak (+10 PTS)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Pratinjau Foto Bukti */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-400">
              <HugeiconsIcon icon={Image01Icon} size={20} />
              <DialogTitle className="font-display text-lg font-bold text-[#0a192f] dark:text-slate-100">
                Lampiran Foto Bukti Perizinan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Pratinjau dokumen surat izin / sakit yang dilampirkan oleh
              anggota.
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden my-2">
              <Image
                src={selectedImage}
                alt="Foto Bukti Surat Izin"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedImage(null)}
              className="font-mono text-xs uppercase h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Tutup Pratinjau
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Penolakan */}
      <Dialog
        open={!!rejectingItem}
        onOpenChange={(open) => !open && setRejectingItem(null)}
      >
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
              <DialogTitle className="font-display text-lg font-bold text-[#0a192f] dark:text-slate-100">
                Konfirmasi Penolakan Perizinan
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Penolakan perizinan anggota{" "}
              <span className="font-bold text-[#0a192f] dark:text-slate-200">
                {rejectingItem?.profile?.full_name}
              </span>{" "}
              akan menerbitkan sanksi otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-red-50 dark:bg-red-950/60 p-3.5 border border-red-200 dark:border-red-800 rounded-xl space-y-1 font-mono text-xs text-red-700 dark:text-red-300">
              <div className="font-bold uppercase">
                SANKSI OTOMATIS: +10 POIN KEDISIPLINAN
              </div>
              <div className="text-[11px] text-red-600/90 dark:text-red-400 font-sans">
                Penolakan izin akan memicu penerbitan sanksi ketidakhadiran
                sesuai SOP Komisi Disiplin.
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100">
                Alasan Penolakan Komdis (Opsional)
              </Label>
              <Textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Contoh: Bukti surat sakit tidak melampirkan stempel resmi fasilitas kesehatan..."
                className="bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 min-h-24 rounded-lg"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingItem(null)}
              disabled={isPending}
              className="font-mono text-xs uppercase h-9 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleRejectSubmit}
              className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase h-9 rounded-lg"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="animate-spin"
                    size={14}
                  />
                  Memproses...
                </span>
              ) : (
                "Tolak (+10 PTS)"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
