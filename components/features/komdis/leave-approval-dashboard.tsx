"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { reviewLeaveRequest } from "@/lib/actions/komdis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Cancel01Icon,
  File01Icon,
  FilterIcon,
  Loading03Icon,
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
  const [filter, setFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<LeaveRequestItem | null>(
    null,
  );
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const [isPending, startTransition] = useTransition();

  const filteredRequests = initialRequests.filter((req) => {
    if (filter === "all") return true;
    return (req.approval_status || "pending") === filter;
  });

  const handleApprove = (attendanceId: string) => {
    startTransition(async () => {
      try {
        await reviewLeaveRequest({
          attendanceId,
          approvalStatus: "approved",
          pointsAwarded: 5, // SOP Komdis: 5 Poin untuk Izin/Sakit Diterima
        });
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Gagal menyetujui izin");
      }
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectingItem) return;
    startTransition(async () => {
      try {
        await reviewLeaveRequest({
          attendanceId: rejectingItem.id,
          approvalStatus: "rejected",
          pointsAwarded: 10, // SOP Komdis: 10 Poin untuk Izin Ditolak
          rejectionReason: rejectionReasonInput,
        });
        setRejectingItem(null);
        setRejectionReasonInput("");
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Gagal menolak izin");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Stat & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-card-dark p-6 border border-hairline-dark rounded-none">
        <div>
          <div className="flex items-center gap-2 text-cyber-blue font-mono text-[10px] uppercase tracking-widest">
            <HugeiconsIcon icon={FilterIcon} size={14} />
            <span>KONTROL ANTREAN PERIZINAN</span>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white font-sans mt-1">
            PERIZINAN KOMISI DISIPLIN
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-canvas-dark p-1 border border-hairline-dark">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-none ${
                filter === tab
                  ? "bg-cyber-blue text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "pending"
                ? "MENUNGGU"
                : tab === "approved"
                  ? "DITERIMA"
                  : tab === "rejected"
                    ? "DITOLAK"
                    : "SEMUA"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Request Items */}
      {filteredRequests.length === 0 ? (
        <Card className="bg-surface-card-dark border-hairline-dark text-center py-12 rounded-none">
          <CardContent className="space-y-2">
            <HugeiconsIcon
              icon={File01Icon}
              size={36}
              className="mx-auto text-gray-500"
            />
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
              TIDAK ADA ANTREAN PERIZINAN BERSTATUS [{filter.toUpperCase()}]
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((item) => {
            const status = item.approval_status || "pending";
            return (
              <Card
                key={item.id}
                className="bg-surface-card-dark border-hairline-dark rounded-none shadow-none flex flex-col justify-between"
              >
                <CardHeader className="border-b border-hairline-dark pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-cyber-blue tracking-widest uppercase">
                        NIM: {item.profile?.nim || "N/A"}
                      </span>
                      <CardTitle className="text-lg font-bold text-white uppercase font-sans mt-0.5">
                        {item.profile?.full_name || "Anggota Tanpa Nama"}
                      </CardTitle>
                    </div>

                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider rounded-sm border ${
                        status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-crimson-red/10 text-crimson-red border-crimson-red/30"
                      }`}
                    >
                      {status === "pending"
                        ? "PENDING (+5/10 POIN)"
                        : status === "approved"
                          ? "DITERIMA (+5 POIN)"
                          : "DITOLAK (+10 POIN)"}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-gray-400 mt-2 space-y-0.5">
                    <div>
                      KEGIATAN:{" "}
                      <span className="text-gray-200">
                        {item.activity?.title || "Kegiatan Formal"}
                      </span>
                    </div>
                    <div>
                      STATUS PRESENSI:{" "}
                      <span className="text-cyber-blue font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      ALASAN / CATATAN PERIZINAN:
                    </div>
                    <p className="text-sm text-gray-300 font-sans font-light bg-canvas-dark/60 p-3 border border-hairline-dark">
                      {item.notes || "Tidak ada alasan tertulis."}
                    </p>

                    {item.rejection_reason && (
                      <div className="mt-2 text-xs font-mono text-crimson-red bg-crimson-red/10 p-2 border border-crimson-red/20">
                        ALASAN PENOLAKAN KOMDIS: {item.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Foto Bukti Preview Button */}
                  {item.proof_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedImage(item.proof_url)}
                      className="w-full bg-canvas-dark border-hairline-dark hover:bg-surface-card-dark text-cyber-blue font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
                    >
                      <HugeiconsIcon
                        icon={File01Icon}
                        size={14}
                        className="mr-2"
                      />
                      [ LIHAT FOTO BUKTI SURAT ]
                    </Button>
                  )}

                  {/* Operational Action Buttons */}
                  {status === "pending" && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline-dark">
                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={16}
                          className="mr-1.5"
                        />
                        APPROVE (5 PTS)
                      </Button>

                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectionReasonInput("");
                        }}
                        className="bg-crimson-red hover:bg-crimson-red/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
                      >
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={16}
                          className="mr-1.5"
                        />
                        REJECT (10 PTS)
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
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-surface-card-dark border border-hairline-dark p-4 max-w-2xl w-full relative space-y-4">
            <div className="flex justify-between items-center border-b border-hairline-dark pb-3">
              <span className="font-mono text-xs text-cyber-blue uppercase tracking-widest">
                LAMPIRAN FOTO BUKTI PERIZINAN
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                [ TUTUP X ]
              </button>
            </div>

            <div className="relative aspect-4/3 w-full bg-canvas-dark border border-hairline-dark overflow-hidden">
              <Image
                src={selectedImage}
                alt="Foto Bukti Surat Izin"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Alasan Penolakan */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-surface-card-dark border border-hairline-dark p-6 max-w-md w-full space-y-4">
            <div className="border-b border-hairline-dark pb-3">
              <div className="font-mono text-xs text-crimson-red uppercase tracking-widest">
                KONFIRMASI PENOLAKAN PERIZINAN
              </div>
              <h3 className="text-lg font-bold text-white uppercase font-sans mt-1">
                {rejectingItem.profile?.full_name}
              </h3>
            </div>

            <div className="space-y-2 font-mono text-xs text-gray-300">
              <p>
                Sanksi Otomatis:{" "}
                <span className="text-crimson-red font-bold">10 POIN</span>
              </p>
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest">
                ALASAN PENOLAKAN (OPSIONAL):
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Contoh: Bukti surat sakit tidak melampirkan cap resmi dokter..."
                className="w-full bg-canvas-dark border border-hairline-dark p-3 text-xs text-white font-sans focus:outline-hidden focus:border-cyber-blue rounded-none h-24"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingItem(null)}
                className="flex-1 bg-canvas-dark border-hairline-dark text-gray-400 font-mono text-xs rounded-none cursor-pointer"
              >
                BATAL
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleRejectSubmit}
                className="flex-1 bg-crimson-red hover:bg-crimson-red/90 text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer"
              >
                {isPending ? (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  "TOLAK (+10 PTS)"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
