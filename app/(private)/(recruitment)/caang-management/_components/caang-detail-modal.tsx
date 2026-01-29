"use client";

import { useState } from "react";
import {
  X,
  User,
  FileText,
  Heart,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { CaangData } from "@/lib/firebase/services/caang-service";
import {
  blacklistCaang,
  verifyRegistration,
  rejectRegistration,
  requestRevision,
} from "@/lib/firebase/services/caang-service";
import { useCaangManagement } from "../_context/caang-management-context";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { BiodataTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/biodata-tab";
import { DocumentsTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/documents-tab";
import { EssayTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/essay-tab";
import { HistoryTab } from "@/app/(private)/(recruitment)/caang-management/_components/modal-tabs/history-tab";
import { toast } from "sonner";

interface CaangDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caang: CaangData;
}

type TabType = "biodata" | "documents" | "essay" | "history";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "biodata", label: "Biodata", icon: User },
  { id: "documents", label: "Berkas & Pembayaran", icon: FileText },
  { id: "essay", label: "Essay & Motivasi", icon: Heart },
  { id: "history", label: "Riwayat & Nilai", icon: History },
];

export function CaangDetailModal({
  isOpen,
  onClose,
  caang,
}: CaangDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("biodata");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  // Verification states
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Rejection states
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  const { refreshData } = useCaangManagement();
  const { user } = useDashboard();

  if (!isOpen) return null;

  const isBlacklisted = caang.user.blacklistInfo?.isBlacklisted;
  const isSubmitted = caang.registration?.status === "submitted";
  const isVerified = caang.registration?.status === "verified";
  const isRejected = caang.registration?.status === "rejected";

  const handleBlacklist = async () => {
    if (!blacklistReason.trim()) return;

    try {
      setIsBlacklisting(true);
      await blacklistCaang(
        caang.user.id,
        blacklistReason,
        user?.uid || "admin",
      );
      await refreshData();
      setShowBlacklistConfirm(false);
      setBlacklistReason("");
      toast.success("Peserta berhasil di-blacklist");
      onClose();
    } catch (error) {
      console.error("Error blacklisting:", error);
      toast.error("Gagal melakukan blacklist");
    } finally {
      setIsBlacklisting(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await verifyRegistration(caang.user.id, user?.uid || "admin");
      await refreshData();
      setShowVerifyConfirm(false);
      toast.success("Registrasi berhasil diverifikasi");
      onClose();
    } catch (error) {
      console.error("Error verifying:", error);
      toast.error("Gagal memverifikasi registrasi");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    try {
      setIsRejecting(true);
      await rejectRegistration(
        caang.user.id,
        user?.uid || "admin",
        rejectionReason,
      );
      await refreshData();
      setShowRejectConfirm(false);
      setRejectionReason("");
      toast.success("Registrasi ditolak secara permanen");
      onClose();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Gagal menolak registrasi");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan revisi wajib diisi");
      return;
    }

    try {
      setIsRequestingRevision(true);
      await requestRevision(
        caang.user.id,
        user?.uid || "admin",
        rejectionReason,
      );
      await refreshData();
      setShowRejectConfirm(false);
      setRejectionReason("");
      toast.success("Permintaan revisi berhasil dikirim");
      onClose();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Gagal mengirim permintaan revisi");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "biodata":
        return <BiodataTab caang={caang} />;
      case "documents":
        return <DocumentsTab caang={caang} />;
      case "essay":
        return <EssayTab caang={caang} />;
      case "history":
        return <HistoryTab caang={caang} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm h-screen"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Detail Calon Anggota
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {caang.user.profile?.fullName || "N/A"}
                </p>
                {isSubmitted && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                    Menunggu Verifikasi
                  </span>
                )}
                {isVerified && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-full">
                    Terverifikasi
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full">
                    Ditolak
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 overflow-x-auto min-h-14">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {/* Left Side Actions */}
            <div className="flex items-center gap-2">
              {/* Blacklist Section */}
              {showBlacklistConfirm ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Alasan blacklist..."
                    value={blacklistReason}
                    onChange={(e) => setBlacklistReason(e.target.value)}
                    className="w-48 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleBlacklist}
                    disabled={!blacklistReason.trim() || isBlacklisting}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isBlacklisting ? "..." : "OK"}
                  </button>
                  <button
                    onClick={() => {
                      setShowBlacklistConfirm(false);
                      setBlacklistReason("");
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBlacklistConfirm(true)}
                  disabled={isBlacklisted}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isBlacklisted
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isBlacklisted ? "Blacklisted" : "Blacklist"}
                </button>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Verification Buttons - Only show if status is 'submitted' */}
              {isSubmitted && (
                <>
                  <button
                    onClick={() => setShowRejectConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setShowVerifyConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verifikasi
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Confirmation Modal */}
      {showVerifyConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowVerifyConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Konfirmasi Verifikasi
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Apakah Anda yakin ingin memverifikasi registrasi ini?
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Nama:</span>{" "}
                {caang.user.profile?.fullName || "N/A"}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                <span className="font-medium">NIM:</span>{" "}
                {caang.user.profile?.nim || "N/A"}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowVerifyConfirm(false)}
                disabled={isVerifying}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Ya, Verifikasi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowRejectConfirm(false);
              setRejectionReason("");
            }}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Tolak Registrasi
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Berikan alasan penolakan registrasi
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Nama:</span>{" "}
                {caang.user.profile?.fullName || "N/A"}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                <span className="font-medium">NIM:</span>{" "}
                {caang.user.profile?.nim || "N/A"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Dokumen tidak lengkap, bukti pembayaran tidak valid, dll."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Pilih tindakan yang sesuai:
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setRejectionReason("");
                  }}
                  disabled={isRejecting || isRequestingRevision}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleRequestRevision}
                  disabled={
                    isRejecting ||
                    isRequestingRevision ||
                    !rejectionReason.trim()
                  }
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRequestingRevision ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Minta Revisi"
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={
                    isRejecting ||
                    isRequestingRevision ||
                    !rejectionReason.trim()
                  }
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRejecting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Tolak Permanen
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                <strong>Minta Revisi:</strong> Caang bisa edit dan submit ulang
                <br />
                <strong>Tolak Permanen:</strong> Tidak ada kesempatan lagi
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
